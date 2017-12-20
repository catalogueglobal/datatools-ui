import fetch from 'isomorphic-fetch'
import qs from 'qs'
import S3 from 'aws-sdk/clients/s3'
import {createAction} from 'redux-actions'

import {secureFetch} from '../../common/actions'
import {GTFS_GRAPHQL_PREFIX, SECURE_API_PREFIX} from '../../common/constants'
import {getConfigProperty} from '../../common/util/config'
import {uploadFile} from '../../common/util/upload-file'
import fileDownload from '../../common/util/file-download'
import {getEntityGraphQLRoot, getEntityIdField, getEntityTableString} from '../../gtfs/util'
import {setErrorMessage, startJobMonitor} from './status'
import {fetchFeedSource} from './feeds'

export const requestingFeedVersions = createAction('REQUESTING_FEEDVERSIONS')

export function receiveFeedVersions (feedSource, feedVersions) {
  return {
    type: 'RECEIVE_FEEDVERSIONS',
    feedSource,
    feedVersions
  }
}

export function setActiveVersion (feedVersion) {
  return {
    type: 'SET_ACTIVE_FEEDVERSION',
    feedVersion
  }
}

export function fetchFeedVersions (feedSource, unsecured) {
  return function (dispatch, getState) {
    dispatch(requestingFeedVersions())
    const apiRoot = unsecured ? 'public' : 'secure'
    const url = `/api/manager/${apiRoot}/feedversion?feedSourceId=${feedSource.id}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(versions => {
        dispatch(receiveFeedVersions(feedSource, versions))
        return versions
      })
  }
}

export function requestingFeedVersion () {
  return {
    type: 'REQUESTING_FEEDVERSION'
  }
}

export function receiveFeedVersion (feedVersion) {
  return {
    type: 'RECEIVE_FEEDVERSION',
    feedVersion
  }
}

export function fetchFeedVersion (feedVersionId) {
  return function (dispatch, getState) {
    dispatch(requestingFeedVersion())
    const url = `${SECURE_API_PREFIX}feedversion/${feedVersionId}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(version => {
        return dispatch(receiveFeedVersion(version))
      })
  }
}

export function publishingFeedVersion (feedVersion) {
  return {
    type: 'PUBLISHING_FEEDVERSION',
    feedVersion
  }
}

export function publishedFeedVersion (feedVersion) {
  return {
    type: 'PUBLISHED_FEEDVERSION',
    feedVersion
  }
}

export function publishFeedVersion (feedVersion) {
  return function (dispatch, getState) {
    dispatch(publishingFeedVersion(feedVersion))
    const url = `${SECURE_API_PREFIX}feedversion/${feedVersion.id}/publish`
    return dispatch(secureFetch(url, 'post'))
      .then(response => response.json())
      .then(version => {
        return dispatch(publishedFeedVersion(version))
      })
  }
}

export function fetchPublicFeedVersions (feedSource) {
  return function (dispatch, getState) {
    dispatch(requestingFeedVersions())
    const url = `/api/manager/public/feedversion?feedSourceId=${feedSource.id}&public=true`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(versions => {
        dispatch(receiveFeedVersions(feedSource, versions))
      })
  }
}

// Upload a GTFS File as a new FeedVersion

export function uploadingFeed (feedSource, file) {
  return {
    type: 'UPLOADING_FEED',
    feedSource,
    file
  }
}

export function uploadedFeed (feedSource) {
  return {
    type: 'UPLOADED_FEED',
    feedSource
  }
}

export function feedNotModified (feedSource, message) {
  return {
    type: 'FEED_NOT_MODIFIED',
    feedSource,
    message
  }
}

export function uploadFeed (feedSource, file) {
  return function (dispatch, getState) {
    dispatch(uploadingFeed(feedSource, file))
    const url = `${SECURE_API_PREFIX}feedversion?feedSourceId=${feedSource.id}&lastModified=${file.lastModified}`

    return uploadFile({file, url, token: getState().user.token})
      .then(res => {
        // 304 halt thrown by server if uploaded feed matches the hash of the
        // latest version
        if (res.status === 304) {
          // Do not start job monitor if feed matches latest version. Display the
          // status modal with a message about the cancelled upload.
          dispatch(feedNotModified(feedSource, 'Feed upload cancelled because it matches latest feed version.'))
        } else if (res.status >= 400) {
          dispatch(setErrorMessage('Error uploading feed source'))
        } else {
          dispatch(uploadedFeed(feedSource))
          dispatch(startJobMonitor())
        }
        console.log('uploadFeed result', res)

        // fetch feed source with versions
        return dispatch(fetchFeedSource(feedSource.id, true))
      })
  }
}

export function deletingFeedVersion (feedVersion) {
  return {
    type: 'DELETING_FEEDVERSION',
    feedVersion
  }
}

export function deleteFeedVersion (feedVersion, changes) {
  return function (dispatch, getState) {
    dispatch(deletingFeedVersion(feedVersion))
    const url = `${SECURE_API_PREFIX}feedversion/${feedVersion.id}`
    return dispatch(secureFetch(url, 'delete'))
      .then((res) => {
        // fetch feed source with versions + snapshots
        return dispatch(fetchFeedSource(feedVersion.feedSource.id, true, true))
      })
  }
}
export function requestingValidationResult (feedVersion) {
  return {
    type: 'REQUESTING_VALIDATION_RESULT',
    feedVersion
  }
}
export function receiveValidationResult (feedVersion, validationResult) {
  return {
    type: 'RECEIVE_VALIDATION_RESULT',
    feedVersion,
    validationResult
  }
}

const fetchingValidationErrors = createAction('FETCHING_VALIDATION_ERRORS')

const receiveValidationErrors = createAction('RECEIVE_VALIDATION_ERRORS')
const fetchingGTFSEntities = createAction('FETCHING_GTFS_ENTITIES')
const receiveGTFSEntities = createAction('RECEIVE_GTFS_ENTITIES')

export function fetchGTFSEntities ({feedVersion, id, type}) {
  return function (dispatch, getState) {
    const {namespace} = feedVersion
    const entityIdField = getEntityIdField(type)
    const entityTableString = getEntityTableString(type)
    const graphQLRoot = getEntityGraphQLRoot(type)
    const gtfsSpec = getConfigProperty('modules.editor.spec')
    const table = gtfsSpec.find(table => table.id === entityTableString)
    let fields = ''
    if (table) {
      fields = table.fields
        .filter(field => field.required && !field.datatools)
        .map(field => field.name)
        .join('\n')
      // stop_times are a special case because they must be requested as a
      // nested list underneath a trip
      if (type === 'StopTime') {
        fields = `
          trip_id
          stop_times {
            ${fields}
          }
        `
      }
    }
    const query = `
      query entityQuery($namespace: String, $${entityIdField}: [String]) {
        feed(namespace: $namespace) {
          feed_id
          feed_version
          filename
          ${graphQLRoot} (${entityIdField}: $${entityIdField}) {
            ${fields}
          }
        }
      }
    `
    dispatch(fetchingGTFSEntities({feedVersion, id, type}))
    return fetchGraphQL({query, variables: {namespace, [entityIdField]: id}})
      .then(response => response.json())
      .then(data => {
        const entities = data.data
        dispatch(receiveGTFSEntities({feedVersion, id, type, entities}))
      })
      .catch(err => console.log(err))
  }
}

export function fetchValidationErrors ({feedVersion, errorType, limit, offset}) {
  console.log(feedVersion)
  return function (dispatch, getState) {
    dispatch(fetchingValidationErrors({feedVersion, errorType, limit, offset}))
    // FIXME: why does namespace need to appear twice?
    const query = `
      query errorsQuery($namespace: String, $errorType: [String], $limit: Int, $offset: Int) {
        feed(namespace: $namespace) {
          feed_id
          feed_version
          filename
          errors (error_type: $errorType, limit: $limit, offset: $offset) {
            error_type
            entity_type
            entity_id
            line_number
            bad_value
            entity_sequence
          }
        }
      }
    `
    const {namespace} = feedVersion
    return fetchGraphQL({query, variables: {namespace, errorType: [errorType], limit, offset}})
    .then(response => response.json())
    .then(result => {
      if (result.data.feed) {
        const {errors} = result.data.feed
        dispatch(receiveValidationErrors({feedVersion, errorType, limit, offset, errors}))
      }
    })
    .catch(err => console.log(err))
  }
}

function fetchGraphQL ({query, variables, ...requestParams}) {
  const body = JSON.stringify({
    query,
    variables: variables
  })
  return fetch(GTFS_GRAPHQL_PREFIX, {
    method: 'post',
    body,
    ...requestParams,
    headers: {'Content-Type': 'application/json'}
  })
}

export function fetchValidationResult (feedVersion, isPublic) {
  return function (dispatch, getState) {
    dispatch(requestingValidationResult(feedVersion))
    const {namespace} = feedVersion
    const query = `
      query countsQuery($namespace: String) {
        feed(namespace: $namespace) {
          feed_id
          feed_version
          filename
          row_counts {
            stops
            trips
            calendar_dates
            errors
          }
          error_counts {
            type count message
          }
        }
      }
    `
    return fetchGraphQL({query, variables: {namespace}})
    .then(response => response.json())
    .then(result => {
      if (result.data.feed) {
        dispatch(receiveValidationResult(feedVersion, result.data.feed))
      }
    })
    .catch(err => console.log(err))
  }
}

export function requestingFeedVersionIsochrones (feedVersion, fromLat, fromLon, toLat, toLon, date, fromTime, toTime) {
  return {
    type: 'REQUESTING_FEEDVERSION_ISOCHRONES',
    feedVersion,
    fromLat,
    fromLon,
    toLat,
    toLon,
    date,
    fromTime,
    toTime
  }
}

export function receiveFeedVersionIsochrones (feedSource, feedVersion, isochrones, fromLat, fromLon, toLat, toLon, date, fromTime, toTime) {
  return {
    type: 'RECEIVE_FEEDVERSION_ISOCHRONES',
    feedSource,
    feedVersion,
    isochrones,
    fromLat,
    fromLon,
    toLat,
    toLon,
    date,
    fromTime,
    toTime
  }
}

export function fetchFeedVersionIsochrones (feedVersion, fromLat, fromLon, toLat, toLon, date, fromTime, toTime) {
  return function (dispatch, getState) {
    if (typeof date === 'undefined' || typeof fromTime === 'undefined' || typeof toTime === 'undefined') {
      date = getState().gtfs.filter.dateTimeFilter.date
      fromTime = getState().gtfs.filter.dateTimeFilter.from
      toTime = getState().gtfs.filter.dateTimeFilter.to
    }
    dispatch(requestingFeedVersionIsochrones(feedVersion, fromLat, fromLon, toLat, toLon, date, fromTime, toTime))
    const params = {fromLat, fromLon, toLat, toLon, date, fromTime, toTime}
    const url = `${SECURE_API_PREFIX}feedversion/${feedVersion.id}/isochrones?${qs.stringify(params)}`
    return dispatch(secureFetch(url))
      .then(res => {
        console.log(res.status)
        if (res.status === 202) {
          // dispatch(setStatus)
          console.log('building network')
          return []
        }
        return res.json()
      })
      .then(isochrones => {
        console.log('received isochrones ', isochrones)
        dispatch(receiveFeedVersionIsochrones(feedVersion.feedSource, feedVersion, isochrones, fromLat, fromLon, toLat, toLon, date, fromTime, toTime))
        return isochrones
      })
  }
}

// Download a GTFS file for a FeedVersion
export function downloadFeedViaToken (feedVersion, isPublic, prefix = 'gtfs') {
  return function (dispatch, getState) {
    const route = isPublic ? 'public' : 'secure'
    const url = `/api/manager/${route}/feedversion/${feedVersion.id}/downloadtoken`
    dispatch(secureFetch(url))
    .then(response => response.json())
    .then(credentials => {
      if (getConfigProperty('application.data.use_s3_storage')) {
        dispatch(downloadS3Key(credentials, `${feedVersion.id}`, prefix))
      } else {
        // use token to download feed
        window.location.assign(`/api/manager/downloadfeed/${credentials.id}`)
      }
    })
  }
}

export function downloadS3Key (credentials, filename, folder = null) {
  return function (dispatch, getState) {
    // Set credentials and region
    const s3 = new S3({
      apiVersion: '2006-03-01',
      credentials
    })
    const Bucket = getConfigProperty('application.data.gtfs_s3_bucket')
    const Key = folder ? `${folder}/${filename}` : filename
    console.log(`downloading ${Key} from ${Bucket}`)
    s3.getObject({Bucket, Key}, (err, data) => {
      if (err) {
        console.log(err)
        dispatch(setErrorMessage(`Error downloading feed:\n${err}`))
      }
      if (data) {
        fileDownload(data.Body, filename, data.contentType)
      }
    })
  }
}

export function creatingFeedVersionFromSnapshot () {
  return {
    type: 'CREATING_FEEDVERSION_FROM_SNAPSHOT'
  }
}
export function createFeedVersionFromSnapshot (feedSource, snapshotId) {
  return function (dispatch, getState) {
    dispatch(creatingFeedVersionFromSnapshot())
    const url = `${SECURE_API_PREFIX}feedversion/fromsnapshot?feedSourceId=${feedSource.id}&snapshotId=${snapshotId}`
    return dispatch(secureFetch(url, 'post'))
      .then((res) => {
        if (res) dispatch(startJobMonitor())
      })
  }
}

export function renamingFeedVersion () {
  return {
    type: 'RENAMING_FEEDVERSION'
  }
}

export function renameFeedVersion (feedVersion, name) {
  return function (dispatch, getState) {
    dispatch(renamingFeedVersion())
    const url = `${SECURE_API_PREFIX}feedversion/${feedVersion.id}/rename?name=${name}`
    return dispatch(secureFetch(url, 'put'))
      .then((res) => {
        dispatch(fetchFeedVersion(feedVersion.id))
      })
  }
}
