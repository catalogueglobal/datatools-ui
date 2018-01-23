import fetch from 'isomorphic-fetch'

import { compose, stopsFiltered } from '../../gtfs/util/graphql'
import { fetchPatterns } from './patterns'

export function fetchingStops (feedId, routeId, patternId, date, from, to) {
  return {
    type: 'FETCH_GRAPHQL_STOPS',
    feedId,
    routeId,
    patternId,
    date,
    from,
    to
  }
}

export function clearStops () {
  return {
    type: 'CLEAR_GRAPHQL_STOPS'
  }
}

export function errorFetchingStops (feedId, routeId, patternId, date, from, to) {
  return {
    type: 'FETCH_GRAPHQL_STOPS_REJECTED',
    feedId,
    routeId,
    patternId,
    date,
    from,
    to
  }
}

export function receiveStops (feedId, routeId, patternId, data) {
  return {
    type: 'FETCH_GRAPHQL_STOPS_FULFILLED',
    feedId,
    routeId,
    patternId,
    data
  }
}

export function fetchStopsWithFilters (feedId) {
  return function (dispatch, getState) {
    const state = getState()
    const {date, from, to} = state.gtfs.filter.dateTimeFilter
    const routeId = state.gtfs.stops.routeFilter
    const patternId = state.gtfs.stops.patternFilter
    if (!routeId && !patternId) {
      return dispatch(receiveStops(feedId, routeId, patternId, {stops: []}))
    }
    dispatch(fetchingStops(feedId, routeId, patternId, date, from, to))
    return fetch(compose(stopsFiltered(feedId, routeId, patternId, date, from, to), {feedId, routeId, patternId, date, from, to}))
      .then((response) => {
        if (response.status >= 300) {
          return dispatch(errorFetchingStops(feedId, routeId, patternId, date, from, to))
        }
        return response.json()
      })
      .then(json => {
        const stops = json.data
        dispatch(receiveStops(feedId, routeId, patternId, stops))
      })
  }
}

export function fetchStops (feedId, routeId, patternId, date, from, to) {
  return function (dispatch, getState) {
    dispatch(fetchingStops(feedId, routeId, patternId, date, from, to))
    return fetch(compose(stopsFiltered(feedId, routeId, patternId, date, from, to), {feedId, routeId, patternId, date, from, to}))
      .then((response) => {
        return response.json()
      })
      .then(json => {
        const stops = json.data
        dispatch(receiveStops(feedId, routeId, patternId, stops))
      })
  }
}

export function updateStopRouteFilter (routeId) {
  return {
    type: 'STOP_ROUTE_FILTER_CHANGE',
    payload: routeId
  }
}

export function updateStopPatternFilter (patternId) {
  return {
    type: 'STOP_PATTERN_FILTER_CHANGE',
    payload: patternId
  }
}

export function stopDateTimeFilterChange (feedId, props) {
  return function (dispatch, getState) {
    dispatch(fetchStopsWithFilters(feedId))
  }
}

export function stopPatternFilterChange (feedId, patternData) {
  return function (dispatch, getState) {
    const state = getState()
    const {date, from, to} = state.gtfs.filter.dateTimeFilter
    const patternId = (patternData && patternData.pattern_id) ? patternData.pattern_id : null
    const routeId = (patternData && patternData.route_id) ? patternData.route_id : null
    dispatch(updateStopPatternFilter(patternId))

    const routeFilter = state.gtfs.stops.routeFilter
    if (!routeFilter && patternId) {
      dispatch(updateStopRouteFilter(routeId))
    }
    if (patternId) {
      dispatch(fetchStops(feedId, null, patternId, date, from, to))
    } else if (routeFilter) { // fetch stops for route if route filter set and pattern filter set to null
      dispatch(fetchStops(feedId, routeFilter, null, date, from, to))
    }
  }
}

export function stopRouteFilterChange (feedId, routeData) {
  return function (dispatch, getState) {
    const routeId = (routeData && routeData.route_id) ? routeData.route_id : null
    dispatch(updateStopRouteFilter(routeId))
    dispatch(updateStopPatternFilter(null))
    dispatch(fetchPatterns(feedId, routeId, null))
    dispatch(fetchStopsWithFilters(feedId))
  }
}
