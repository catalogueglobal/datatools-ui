// @flow

import {createAction} from 'redux-actions'

export function updatingGtfsFilter (activeProject: any, user: any) {
  return {
    type: 'UPDATE_GTFS_FILTER',
    activeProject,
    user
  }
}

export function updateLoadedFeeds (loadedFeeds: any) {
  return {
    type: 'UPDATE_LOADED_FEEDS',
    loadedFeeds
  }
}

export const updateRouteFilter = createAction('ROUTE_FILTER_CHANGE')
export const updatePatternFilter = createAction('PATTERN_FILTER_CHANGE')
export const updateArrivalDisplay = createAction('SHOW_ARRIVAL_CHANGE')
export const updateTimepointFilter = createAction('TIMEPOINT_CHANGE')
export const updateDateTimeFilter = createAction('UPDATE_GTFS_DATETIME_FILTER')
export const updateRouteOffset = createAction('UPDATE_ROUTE_OFFSET')
export const addActiveFeed = createAction('ADD_ACTIVE_FEED')
export const removeActiveFeed = createAction('REMOVE_ACTIVE_FEED')
export const addAllActiveFeeds = createAction('ADD_ALL_ACTIVE_FEEDS')
export const removeAllActiveFeeds = createAction('REMOVE_ALL_ACTIVE_FEEDS')

export const updateMapState = createAction('UPDATE_GTFS_MAP_STATE')
export const updatePermissionFilter = createAction('UPDATE_GTFS_PERMISSION_FILTER')
export const updateRoutesOnMapDisplay = createAction('SHOW_ALL_ROUTES_ON_MAP_CHANGE')
