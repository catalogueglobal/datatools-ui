// @flow

import {createAction} from 'redux-actions'

import {secureFetch} from '../../common/actions'
import {getFeed, getFeedId} from '../../common/util/modules'
import {getActiveProject} from '../../manager/selectors'

import type {dispatchFn, getStateFn} from '../../types'

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

export function updateMapState (props: any) {
  return {
    type: 'UPDATE_GTFS_MAP_STATE',
    props
  }
}

export function updateGtfsFilter (activeProject: any, user: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(updatingGtfsFilter(activeProject, user))
    const projectFeeds = getActiveProject(getState()).feedSources
    // check GTFS API for feed IDs present in cache
    return dispatch(
      secureFetch(
        `/api/manager/feeds?id=${projectFeeds
          .map(f => getFeedId(f))
          .filter(n => n)
          .join(',')}`
      )
        .then(response => response.json())
        .then(feedIds => {
          // filter out null values
          const feeds = feedIds
            ? feedIds.map(id => getFeed(projectFeeds, id)).filter(n => n)
            : []
          dispatch(updateLoadedFeeds(feeds))
        })
    )
  }
}

export function updatePermissionFilter (permission: any) {
  return {
    type: 'UPDATE_GTFS_PERMISSION_FILTER',
    permission
  }
}

export function updateRouteFilter (routeId: any) {
  return {
    type: 'ROUTE_FILTER_CHANGE',
    payload: routeId
  }
}

export function updatePatternFilter (patternId: any) {
  return {
    type: 'PATTERN_FILTER_CHANGE',
    payload: patternId
  }
}

export const updateArrivalDisplay = createAction('SHOW_ARRIVAL_CHANGE')
export const updateTimepointFilter = createAction('TIMEPOINT_CHANGE')
export const updateDateTimeFilter = createAction('UPDATE_GTFS_DATETIME_FILTER')
export const addActiveFeed = createAction('ADD_ACTIVE_FEED')
export const removeActiveFeed = createAction('REMOVE_ACTIVE_FEED')
export const addAllActiveFeeds = createAction('ADD_ALL_ACTIVE_FEEDS')
export const removeAllActiveFeeds = createAction('REMOVE_ALL_ACTIVE_FEEDS')
