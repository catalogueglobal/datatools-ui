// @flow

import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, fetchGraphQL} from '../../common/actions'
import {timetables} from '../../gtfs/util/graphql'
import type {dispatchFn, getStateFn, TimetableData} from '../../types/reducers'

import {
  updateArrivalDisplay,
  updatePatternFilter,
  updateRouteFilter,
  updateTimepointFilter
} from './filter'
import {fetchPatterns} from './patterns'

export const errorFetchingTimetables = createVoidPayloadAction(
  'FETCH_GRAPHQL_TIMETABLES_REJECTED'
)
export const fetchingTimetables = createVoidPayloadAction(
  'FETCH_GRAPHQL_TIMETABLES'
)
export const receiveTimetables = createAction(
  'FETCH_GRAPHQL_TIMETABLES_FULFILLED',
  (payload: {
    data: null | TimetableData
  }) => payload
)

export type GtfsTimetableActions = ActionType<typeof errorFetchingTimetables> |
  ActionType<typeof fetchingTimetables> |
  ActionType<typeof receiveTimetables>

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
      return dispatch(receiveTimetables({ data: null }))
    }
    dispatch(fetchingTimetables())
    const variables = {date, from, namespace, patternId, routeId, to}
    return dispatch(fetchGraphQL({query: timetables, variables}))
      .then(data => dispatch(receiveTimetables({data})))
  }
}

export function timetablePatternFilterChange (feedId: string, patternId: ?string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(updatePatternFilter(patternId))
    dispatch(fetchTimetablesWithFilters(feedId))
  }
}

export function timetableRouteFilterChange (feedId: string, routeId: ?string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(updateRouteFilter(routeId))
    dispatch(updatePatternFilter(null))
    dispatch(fetchPatterns(feedId, routeId))
    dispatch(fetchTimetablesWithFilters(feedId))
  }
}

export function timetableDateTimeFilterChange (feedId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(fetchPatterns(feedId, getState().gtfs.filter.routeFilter))
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
