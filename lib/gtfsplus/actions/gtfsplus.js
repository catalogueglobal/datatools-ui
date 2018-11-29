// @flow

import JSZip from 'jszip'
import fetch from 'isomorphic-fetch'
import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {getGtfsPlusSpec} from '../../common/util/config'
import {uploadFile} from '../../common/util/upload-file'
// import {stopsAndRoutes, compose} from '../../gtfs/util/graphql'
import {getHeaders} from '../../common/util/util'
import {fetchFeedVersions} from '../../manager/actions/versions'
import type {Feed, FeedVersion, Route, Stop} from '../../types'
import type {dispatchFn, getStateFn, ValidationIssue} from '../../types/reducers'

export const addGtfsPlusRow = createAction(
  'ADD_GTFSPLUS_ROW',
  (payload: { tableId: string }) => payload
)
export const clearGtfsPlusContent = createVoidPayloadAction(
  'CLEAR_GTFSPLUS_CONTENT'
)
export const deleteGtfsPlusRow = createAction(
  'DELETE_GTFSPLUS_ROW',
  (payload: { rowIndex: number, tableId: string }) => payload
)
export const publishingGtfsPlusFeed = createVoidPayloadAction(
  'PUBLISHING_GTFSPLUS_FEED'
)
export const receiveGtfsEntities = createAction(
  'RECEIVE_GTFS_PLUS_ENTITIES',
  (payload: Array<Route | Stop>) => payload
)
export const receiveGtfsPlusContent = createAction(
  'RECEIVE_GTFSPLUS_CONTENT',
  (payload: {
    feedVersionId: null | string,
    fileContent: Array<string>,
    filenames: Array<string>,
    timestamp: number
  }) => payload
)
export const receiveGtfsPlusValidation = createAction(
  'RECEIVE_GTFSPLUS_VALIDATION',
  (payload: Array<ValidationIssue>) => payload
)
export const requestingGtfsPlusContent = createVoidPayloadAction(
  'REQUESTING_GTFSPLUS_CONTENT'
)
export const setActiveTable = createAction(
  'SET_ACTIVE_GTFSPLUS_TABLE',
  (payload: { activeTableId: string }) => payload
)
export const setCurrentPage = createAction(
  'SET_CURRENT_GTFSPLUS_PAGE',
  (payload: { newPage: number }) => payload
)
export const setVisibilityFilter = createAction(
  'SET_GTFSPLUS_VISIBILITY',
  (payload: { visibility: boolean }) => payload
)
export const updateGtfsPlusField = createAction(
  'UPDATE_GTFSPLUS_FIELD',
  (payload: {
    fieldName: string,
    newValue: string,
    rowIndex: number,
    tableId: string
  }) => payload
)
export const uploadedGtfsPlusFeed = createVoidPayloadAction(
  'UPLOADED_GTFSPLUS_FEED'
)
export const uploadingGtfsPlusFeed = createVoidPayloadAction(
  'UPLOADING_GTFSPLUS_FEED'
)
export const validatingGtfsPlusFeed = createVoidPayloadAction(
  'VALIDATING_GTFSPLUS_FEED'
)

export type GtfsPlusActions = ActionType<typeof addGtfsPlusRow> |
  ActionType<typeof clearGtfsPlusContent> |
  ActionType<typeof deleteGtfsPlusRow> |
  ActionType<typeof publishingGtfsPlusFeed> |
  ActionType<typeof receiveGtfsEntities> |
  ActionType<typeof receiveGtfsPlusContent> |
  ActionType<typeof receiveGtfsPlusValidation> |
  ActionType<typeof requestingGtfsPlusContent> |
  ActionType<typeof setActiveTable> |
  ActionType<typeof setCurrentPage> |
  ActionType<typeof setVisibilityFilter> |
  ActionType<typeof updateGtfsPlusField> |
  ActionType<typeof uploadedGtfsPlusFeed> |
  ActionType<typeof uploadingGtfsPlusFeed> |
  ActionType<typeof validatingGtfsPlusFeed>

export function downloadGtfsPlusFeed (feedVersionId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingGtfsPlusContent())

    const {user} = getState()
    if (!user.token) {
      console.warn('user not logged in, unable to download GtfsPlus Feed')
      return
    }
    const fetchFeed = fetch('/api/manager/secure/gtfsplus/' + feedVersionId, {
      method: 'get',
      cache: 'default',
      headers: getHeaders(user.token, false)
    }).then((response) => {
      if (response.status !== 200) {
        console.log('error downloading gtfs+ feed', response.status)
        dispatch(clearGtfsPlusContent())
      }
      return response.blob()
    })

    const fetchTimestamp = dispatch(secureFetch(`/api/manager/secure/gtfsplus/${feedVersionId}/timestamp`))
      .then(response => response.json())

    Promise.all([fetchFeed, fetchTimestamp]).then(([feed, timestamp]) => {
      JSZip.loadAsync(feed).then((zip) => {
        const filenames = []
        const filePromises = []
        zip.forEach((path, file) => {
          filenames.push(path)
          filePromises.push(file.async('string'))
        })
        Promise.all(filePromises).then(fileContent => {
          const cleanFileContent = fileContent.map(cleanString)
          dispatch(receiveGtfsPlusContent({
            feedVersionId,
            fileContent: cleanFileContent,
            filenames,
            timestamp
          }))
          dispatch(validateGtfsPlusFeed(feedVersionId))
        })
      })
    })
  }
}

// clean BOM from string https://en.wikipedia.org/wiki/Byte_order_mark
function cleanString (string): string {
  if (string.charCodeAt(0) === 0xFEFF) {
    string = string.slice(1)
  }
  return string
}

// VALIDATION ACTIONS
export function validateGtfsPlusFeed (feedVersionId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(validatingGtfsPlusFeed())
    const url = `/api/manager/secure/gtfsplus/${feedVersionId}/validation`
    return dispatch(secureFetch(url))
      .then(res => res.json())
      .then(validationIssues => dispatch(receiveGtfsPlusValidation(validationIssues)))
  }
}

// UPLOAD ACTIONS
export function uploadGtfsPlusFeed (feedVersionId: string, file: File) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(uploadingGtfsPlusFeed())
    const url = `/api/manager/secure/gtfsplus/${feedVersionId}`

    const {user} = getState()
    if (!user.token) {
      console.warn('user not logged in, unable to upload GtfsPlus Feed')
      return
    }
    return uploadFile({file, url, token: user.token})
      .then(result => {
        console.log(result)
        return dispatch(uploadedGtfsPlusFeed())
      })
  }
}

export function loadGtfsEntities (
  tableId: string,
  rows: Array<Route | Stop>,
  feedSource: Feed,
  feedVersionId: string
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    // lookup table for mapping tableId:fieldName keys to inputType values
    const typeLookup = {}
    const getDataType = function (tableId, fieldName) {
      const lookupKey = tableId + ':' + fieldName
      if (lookupKey in typeLookup) return typeLookup[lookupKey]
      const specTable = getGtfsPlusSpec().find(t => t.id === tableId)
      if (!specTable) {
        console.warn(`unable to find spec table for tableId: ${tableId}`)
        return null
      }
      const fieldInfo = specTable.fields.find(f => f.name === fieldName)
      if (!fieldInfo) return null
      typeLookup[lookupKey] = fieldInfo.inputType
      return fieldInfo.inputType
    }

    // determine which routes, stops, etc. aren't currently in the gtfsEntityLookup table and need to be loaded from the API
    const routesToLoad = []
    const stopsToLoad = []

    const currentLookup = getState().gtfsplus.gtfsEntityLookup

    for (const rowData of rows) {
      for (const fieldName in rowData) {
        switch (getDataType(tableId, fieldName)) {
          case 'GTFS_ROUTE':
            const routeId = rowData[fieldName]
            if (routeId && !(`route_${routeId}` in currentLookup)) routesToLoad.push(routeId)
            break
          case 'GTFS_STOP':
            const stopId = rowData[fieldName]
            if (stopId && !(`stop_${stopId}` in currentLookup)) stopsToLoad.push(stopId)
            break
        }
      }
    }
    // TODO: replace multiple fetches with GraphQL
    // fetch(compose(stopsAndRoutes(feedId, routesToLoad, stopsToLoad), {feedId, routeId: routesToLoad, stopId: stopsToLoad}))
    //   .then((response) => response.json())
    //   .then(results => {
    //     return dispatch(receivedStopsAndRoutes(results))
    //   })

    // FIXME: major issue here with feedId vs. feedVersionId.
    // Basically, feedId will only reference the published feed version.
    // Here in the GTFS+ editor, we always want routes/stops from the
    // feedVersionId because there may be new routes/stops here that don't exist
    // in the published version.
    if (routesToLoad.length === 0 && stopsToLoad.length === 0) return
    const feedId = feedVersionId.replace('.zip', '')
    var loadRoutes = Promise.all(routesToLoad.map(routeId => {
      const url = `/api/manager/routes/${routeId}?feed=${feedId}`
      return fetch(url)
        .then((response) => response.json())
        .catch(err => console.log(err))
    }))

    var loadStops = Promise.all(stopsToLoad.map(stopId => {
      const url = `/api/manager/stops/${stopId}?feed=${feedId}`
      return fetch(url)
        .then((response) => response.json())
        .catch(err => console.log(err))
    }))

    Promise.all([loadRoutes, loadStops]).then(results => {
      const loadedRoutes = results[0].filter(res => res) // filter out undefined
      const loadedStops = results[1].filter(res => res) // filter out undefined
      dispatch(receiveGtfsEntities(loadedRoutes.concat(loadedStops)))
    })
  }
}

// const receivedStopsAndRoutes = (results, module) => {
//   return {
//     type: 'RECEIVED_GTFSPLUS_STOPS_AND_ROUTES',
//     results,
//     module
//   }
// }

// PUBLISH ACTIONS
export function publishGtfsPlusFeed (feedVersion: FeedVersion) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(publishingGtfsPlusFeed())
    const url = `/api/manager/secure/gtfsplus/${feedVersion.id}/publish`
    return dispatch(secureFetch(url, 'post'))
      .then((res) => res.json())
      .then(json => dispatch(fetchFeedVersions(feedVersion.feedSource)))
  }
}
