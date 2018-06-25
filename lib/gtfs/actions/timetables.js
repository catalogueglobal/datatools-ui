// @flow

import get from 'lodash/get'
import {createAction} from 'redux-actions'

import {secureFetch} from '../../common/actions'
import {
  updateArrivalDisplay,
  updatePatternFilter,
  updateRouteFilter,
  updateTimepointFilter
} from './filter'
import {compose, timetables} from '../../gtfs/util/graphql'
import {fetchPatterns} from './patterns'

import type {dispatchFn, getStateFn} from '../../types'

export const fetchingTimetables = createAction('FETCH_GRAPHQL_TIMETABLES')
export const clearTimetables = createAction('CLEAR_GRAPHQL_TIMETABLES')
export const errorFetchingTimetables = createAction(
  'FETCH_GRAPHQL_TIMETABLES_REJECTED'
)
export const receiveTimetables = createAction(
  'FETCH_GRAPHQL_TIMETABLES_FULFILLED'
)

export function fetchTimetablesWithFilters (namespace: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const state = getState()
    const {
      patternFilter: patternId,
      routeFilter: routeId,
      dateTimeFilter: {
        date,
        from,
        to
      }
    } = state.gtfs.filter
    if (!routeId || !patternId) {
      return dispatch(receiveTimetables({data: {trips: []}}))
    }
    dispatch(fetchingTimetables())
    const params = {date, from, namespace, patternId, routeId, to}
    dispatch(secureFetch(compose(timetables, params)))
      .then(response => response.json())
      .then(json => dispatch(receiveTimetables({data: json.data})))
  }
}

export function timetablePatternFilterChange (feedId: string, patternData: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const patternId = get(patternData, 'pattern_id')
    dispatch(updatePatternFilter(patternId))
    dispatch(fetchTimetablesWithFilters(feedId))
  }
}

export function timetableRouteFilterChange (feedId: string, routeData: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const routeId = routeData && routeData.route_id ? routeData.route_id : null
    dispatch(updateRouteFilter(routeId))
    dispatch(updatePatternFilter(null))
    dispatch(fetchPatterns(feedId, routeId, null))
    dispatch(fetchTimetablesWithFilters(feedId))
  }
}

export function timetableDateTimeFilterChange (feedId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(fetchTimetablesWithFilters(feedId))
  }
}

export function timetableShowArrivalToggle (feedId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const state = getState()
    dispatch(updateArrivalDisplay(!state.gtfs.filter.showArrivals))
  }
}

export function timetableTimepointToggle (feedId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const state = getState()
    dispatch(updateTimepointFilter(!state.gtfs.filter.timepointFilter))
  }
}
