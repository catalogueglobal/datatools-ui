import fetch from 'isomorphic-fetch'

import { compose, feed } from '../../gtfs/util/graphql'
import { updateDateTimeFilter } from './filter'

function fetchingFeed (feedId, date, from, to) {
  return {
    type: 'FETCH_GRAPHQL_FEED',
    feedId,
    date,
    from,
    to
  }
}

function errorFetchingFeed (feedId, date, from, to) {
  return {
    type: 'FETCH_GRAPHQL_FEED_REJECTED',
    feedId,
    date,
    from,
    to
  }
}

function receiveFeed (feedId, data) {
  return {
    type: 'FETCH_GRAPHQL_FEED_FULFILLED',
    feedId,
    data
  }
}

export function fetchFeed (namespace, date, from, to) {
  return function (dispatch, getState) {
    dispatch(fetchingFeed(namespace, date, from, to))
    return fetch(compose(
        feed // (feedId, date, from, to)
      , {namespace, date, from, to})
    )
      .then((response) => {
        if (response.status >= 300) {
          return dispatch(errorFetchingFeed(namespace, date, from, to))
        }
        return response.json()
      })
      .then(json => {
        dispatch(receiveFeed(namespace, json.data))
      })
  }
}

// export function updateStopRouteFilter (routeId) {
//   return {
//     type: 'STOP_ROUTE_FILTER_CHANGE',
//     payload: routeId
//   }
// }
//
// export function updateStopPatternFilter (patternId) {
//   return {
//     type: 'STOP_PATTERN_FILTER_CHANGE',
//     payload: patternId
//   }
// }

export function feedDateTimeFilterChange (feedId, props) {
  return function (dispatch, getState) {
    dispatch(updateDateTimeFilter(props))
    dispatch(fetchFeed(feedId))
  }
}

// export function feedPatternFilterChange (feedId, patternData) {
//   return function (dispatch, getState) {
//     const state = getState()
//     const {date, from, to} = state.gtfs.filter.dateTimeFilter
//
//     if (patternId) {
//       dispatch(fetchFeed(feedId, null, patternId, date, from, to))
//     } else if (routeFilter) { // fetch stops for route if route filter set and pattern filter set to null
//       dispatch(fetchFeed(feedId, routeFilter, null, date, from, to))
//     }
//   }
// }

// export function feedRouteFilterChange (feedId, routeData) {
//   return function (dispatch, getState) {
//     const routeId = (routeData && routeData.route_id) ? routeData.route_id : null
//     dispatch(updateStopRouteFilter(routeId))
//     dispatch(updateStopPatternFilter(null))
//     dispatch(fetchPatterns(feedId, routeId, null))
//     dispatch(fetchFeedWithFilters(feedId))
//   }
// }
