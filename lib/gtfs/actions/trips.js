import fetch from 'isomorphic-fetch'
import {compose, stopTimes, trips} from '../../gtfs/util/graphql'
import {createAction} from 'redux-actions'

export const fetchingTrips = createAction('FETCH_GRAPHQL_TRIPS')
export const fetchingStopTimes = createAction('FETCH_GRAPHQL_STOP_TIMES')

export const clearTrips = createAction('CLEAR_GRAPHQL_TRIPS')

export const errorFetchingTrips = createAction('FETCH_GRAPHQL_TRIPS_REJECTED')

export const receiveTrips = createAction('FETCH_GRAPHQL_TRIPS_FULFILLED')
export const receiveStopTimes = createAction('FETCH_GRAPHQL_STOP_TIMES_FULFILLED')

export function fetchTrips (feedId, tripId) {
  return function (dispatch, getState) {
    dispatch(fetchingTrips({feedId}))
    const method = 'POST'
    const body = JSON.stringify({
      query: trips(feedId, tripId),
      variables: JSON.stringify({feedId, tripId})
    })
    return fetch('/api/manager/graphql', {method, body})
      .then((response) => response.json())
      .then(({trips}) => dispatch(receiveTrips({feedId, trips})))
  }
}

/**
 * fetch trips with nested stop_times
 * @param  {[type]} feedId [description]
 * @param  {[type]} tripId [description]
 * @return {[type]}        [description]
 */
export function fetchStopTimes (feedId, tripId) {
  return function (dispatch, getState) {
    dispatch(fetchingStopTimes({feedId}))
    const method = 'POST'
    return fetch(compose(stopTimes, {feedId, tripId}), {method})
      .then((response) => response.json())
      .then(({trips}) => dispatch(receiveStopTimes({feedId, trips})))
  }
}
