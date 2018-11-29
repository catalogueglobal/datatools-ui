// @flow

import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {fetchSnapshots} from '../../editor/actions/snapshots'
import type {Feed} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

import {fetchFeedSourceDeployments} from './deployments'
import {fetchProject, fetchProjectWithFeeds} from './projects'
import {handleJobResponse} from './status'
import {fetchFeedVersions} from './versions'

// Private actions
const requestingFeedSource = createVoidPayloadAction('REQUESTING_FEEDSOURCE')
const requestingFeedSources = createVoidPayloadAction('REQUESTING_FEEDSOURCES')
export const receiveFeedSources = createAction(
  'RECEIVE_FEEDSOURCES',
  (payload: {
    feedSources: Array<Feed>,
    projectId?: string
  }) => payload
)
const deletingFeedSource = createVoidPayloadAction('DELETING_FEEDSOURCE')
// FIXME: Is receivePublicFeeds needed for the public UI?
// const receivePublicFeeds = createAction('RECEIVE_PUBLIC_FEEDS')
const savingFeedSource = createVoidPayloadAction('SAVING_FEEDSOURCE')
const runningFetchFeed = createVoidPayloadAction('RUNNING_FETCH_FEED')

// Public action used by component or other actions
export const receiveFeedSource = createAction(
  'RECEIVE_FEEDSOURCE',
  (payload: ?Feed) => payload
)
export const createFeedSource = createAction(
  'CREATE_FEEDSOURCE',
  (payload: string) => payload
)

export type FeedActions = ActionType<typeof requestingFeedSource> |
  ActionType<typeof requestingFeedSources> |
  ActionType<typeof receiveFeedSources> |
  ActionType<typeof deletingFeedSource> |
  ActionType<typeof savingFeedSource> |
  ActionType<typeof runningFetchFeed> |
  ActionType<typeof receiveFeedSource> |
  ActionType<typeof createFeedSource>

const FS_URL = '/api/manager/secure/feedsource'
/**
 * Fetch all feeds for a given project ID.
 */
export function fetchProjectFeeds (projectId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingFeedSources())
    return dispatch(secureFetch(`${FS_URL}?projectId=${projectId}`))
      .then(response => response.json())
      .then(feedSources => dispatch(receiveFeedSources({projectId, feedSources})))
  }
}

/**
 * Fetch all feeds user has permission to view.
 */
export function fetchUserFeeds (userId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingFeedSources())
    return dispatch(secureFetch(`${FS_URL}?userId=${userId}`))
      .then(response => response.json())
      .then(feedSources => dispatch(receiveFeedSources({feedSources})))
  }
}

/**
 * Create new feed source from provided properties.
 */
export function saveFeedSource (properties: {name: string, projectId: string }) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(savingFeedSource())
    return dispatch(secureFetch(FS_URL, 'post', properties))
      .then((res) => dispatch(fetchProjectWithFeeds(properties.projectId)))
  }
}

/**
 * Update existing feed source with provided properties. Then re-fetch versions
 * and snapshots for feed source.
 */
export function updateFeedSource (feedSource: Feed, properties: {[string]: any}) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(savingFeedSource())
    return dispatch(secureFetch(`${FS_URL}/${feedSource.id}`, 'put', properties))
      // Re-fetch feed source with versions and snapshots.
      .then((res) => dispatch(fetchFeedSource(feedSource.id, true)))
  }
}

/**
 * Update "external feed resource" properties, i.e., MTC, TransitLand, and
 * TransitFeeds.com.
 */
export function updateExternalFeedResource (
  feedSource: Feed,
  resourceType: string,
  properties: {[string]: any}
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(savingFeedSource())
    const url = `${FS_URL}/${feedSource.id}/updateExternal?resourceType=${resourceType}`
    return dispatch(secureFetch(url, 'put', properties))
      .then((res) => res.json())
      .then(json => dispatch(fetchFeedSource(feedSource.id, true)))
  }
}

/**
 * Permanently delete single feed source. Re-fetches parent project's feeds
 * after deletion.
 */
export function deleteFeedSource (feedSource: Feed) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(deletingFeedSource())
    // If the feed source has not been saved, simply re-fetch feeds.
    if (feedSource.isCreating) return dispatch(fetchProjectFeeds(feedSource.projectId))
    return dispatch(secureFetch(`${FS_URL}/${feedSource.id}`, 'delete'))
      .then(res => dispatch(fetchProjectFeeds(feedSource.projectId)))
  }
}

/**
 * Get feed source for specified ID. This requests the feed source object from
 * the server and should not be confused with runFetchFeed, which attempts to
 * create a new feed version for the feed source by fetching the GTFS file at the
 * feed source fetch URL. This action will optionally fetch the feed source's
 * versions and snapshots following the successful feed source fetch.
 */
export function fetchFeedSource (feedSourceId: string, shouldFetchRelatedTables: ?boolean = false) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingFeedSource())
    // FIXME Add public route?
    return dispatch(secureFetch(`${FS_URL}/${feedSourceId}`))
      .then(res => res.json())
      .then(feedSource => {
        if (!feedSource) {
          // Feed source not found for ID
          dispatch(receiveFeedSource(null))
          return null
        }
        dispatch(receiveFeedSource(feedSource))
        if (shouldFetchRelatedTables) {
          dispatch(fetchRelatedTables(feedSource))
        }
        return feedSource
      })
  }
}

function fetchRelatedTables (feedSource: Feed) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(fetchFeedVersions(feedSource))
    dispatch(fetchSnapshots(feedSource))
    dispatch(fetchFeedSourceDeployments(feedSource))
  }
}

/**
 * When feed source viewer component mounts, load feed source and any feed source
 * sets of objects that reference feed source.
 * TODO: move to component?
 */
export function onFeedSourceViewerMount (initialProps: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {feedSource, project, user} = initialProps
    const {feedSourceId} = initialProps.router.params
    let unsecured = true
    if (user.profile !== null) {
      unsecured = false
    }
    if (!project) {
      // Fetch project and feed source if project not found.
      return dispatch(fetchFeedSourceAndProject(feedSourceId, unsecured))
        .then(feedSource => {
          // go back to projects list if no feed source found
          if (!feedSource) {
            // browserHistory.push('/project')
            return null
          }
          return dispatch(fetchRelatedTables(feedSource))
        })
    } else if (!feedSource) {
      // Fetch feed source with versions and snapshots if not found.
      return dispatch(fetchFeedSource(feedSourceId, true))
    } else if (!feedSource.versions) {
      dispatch(fetchRelatedTables(feedSource))
      return dispatch(fetchFeedVersions(feedSource, unsecured))
    }
  }
}

/**
 * Fetches feed source and parent project.
 */
export function fetchFeedSourceAndProject (
  feedSourceId: string,
  unsecured?: boolean
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingFeedSource())
    return dispatch(secureFetch(`${FS_URL}/${feedSourceId}`))
      .then(res => res.json())
      .then(feedSource => {
        // Once the project has been fetched, dispatch the recieve feed source
        // action (so that the feed source is nested under project).
        return dispatch(fetchProject(feedSource.projectId, unsecured))
          .then(project => {
            dispatch(receiveFeedSource(feedSource))
            return feedSource
          })
      })
      .catch(err => {
        console.warn(err)
        dispatch(receiveFeedSource(null))
      })
  }
}

/**
 * Check for new GTFS file at feed source fetch URL and create new version from
 * the GTFS file if a new file is found.
 */
export function runFetchFeed (feedSource: Feed) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(runningFetchFeed())
    return dispatch(secureFetch(`${FS_URL}/${feedSource.id}/fetch`, 'post'))
      .then(res => dispatch(handleJobResponse(res, 'Error fetching feed source')))
  }
}
