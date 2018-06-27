// @flow

import {createAction} from 'redux-actions'

import {secureFetch} from '../../common/actions'
import {compose, patterns} from '../../gtfs/util/graphql'
import {updateRouteFilter, updatePatternFilter} from './filter'

import type {dispatchFn, getStateFn} from '../../types'

export const fetchingPatterns = createAction('FETCH_GRAPHQL_PATTERNS')
export const clearPatterns = createAction('CLEAR_GRAPHQL_PATTERNS')
export const errorFetchingPatterns = createAction(
  'FETCH_GRAPHQL_PATTERNS_REJECTED'
)
export const receivePatterns = createAction('FETCH_GRAPHQL_PATTERNS_FULFILLED')

export function patternDateTimeFilterChange (namespace: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const state = getState()
    const routeId = state.gtfs.filter.routeFilter
    dispatch(fetchPatterns(namespace, routeId))
  }
}

export function fetchPatterns (namespace: string, routeId: ?string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(fetchingPatterns())
    if (!routeId) {
      const routes = []
      return dispatch(receivePatterns({routes}))
    }
    const {date} = getState().gtfs.filter.dateTimeFilter
    return dispatch(
      secureFetch(compose(patterns, {namespace, routeId, date}))
    )
      .then(response => {
        if (response.status >= 300) {
          return dispatch(errorFetchingPatterns())
        }
        return response.json()
      })
      .then(json => {
        if (json.data) {
          const {routes} = json.data.feed
          dispatch(receivePatterns({routes}))
        } else {
          console.log('Error fetching patterns')
        }
      })
  }
}

export function patternRouteFilterChange (namespace: string, newRouteId: ?string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(updateRouteFilter(newRouteId))
    // If there's an active pattern, clear it
    dispatch(updatePatternFilter(null))
    dispatch(fetchPatterns(namespace, newRouteId))
  }
}
