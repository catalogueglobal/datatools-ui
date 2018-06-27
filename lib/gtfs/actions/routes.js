// @flow

import {createAction} from 'redux-actions'

import {secureFetch} from '../../common/actions'
import {updateRouteOffset} from './filter'
import {allRoutes, compose, routeDetails} from '../../gtfs/util/graphql'

import type {dispatchFn, getStateFn} from '../../types'

// routes is for a list of all routes
export const fetchingRoutes = createAction('FETCH_GRAPHQL_ROUTES')
export const clearRoutes = createAction('CLEAR_GRAPHQL_ROUTES')
export const errorFetchingRoutes = createAction('FETCH_GRAPHQL_ROUTES_REJECTED')
const receiveRoutes = createAction('FETCH_GRAPHQL_ROUTES_FULFILLED')

// the route details includes more details about each route in order to display
// the route trip histogram.  Also, to ensure timely resopnses from the server
// the route details is paginated.  This is the main motivation for having two
// separate entities for deailing with routes
export const fetchingRouteDetails = createAction('FETCH_GRAPHQL_ROUTE_DETAILS')
export const clearRouteDetails = createAction('CLEAR_GRAPHQL_ROUTE_DETAILS')
export const errorFetchingRouteDetails = createAction('FETCH_GRAPHQL_ROUTE_DETAILS_REJECTED')
const receiveRouteDetails = createAction('FETCH_GRAPHQL_ROUTE_DETAILS_FULFILLED')

export function fetchRouteDetails (namespace: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const state = getState()
    const {
      dateTimeFilter,
      routeLimit,
      routeOffset
    } = state.gtfs.filter
    dispatch(fetchingRouteDetails(namespace))
    return dispatch(
      secureFetch(
        compose(routeDetails, {
          date: dateTimeFilter.date,
          namespace,
          routeLimit,
          routeOffset
        })
      )
    )
      .then(response => response.json())
      .then(json => {
        const {
          routes,
          row_counts: {
            routes: numRoutes
          }
        } = json.data.feed
        dispatch(receiveRouteDetails({numRoutes, routes}))
      })
  }
}

export function fetchRoutes (namespace: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(fetchingRoutes(namespace))
    return dispatch(secureFetch(compose(allRoutes, { namespace })))
      .then(response => response.json())
      .then(json => {
        dispatch(receiveRoutes(json.data.feed.routes))
      })
  }
}

export function routeOffsetChange ({
  namespace,
  offset
}: {
  namespace: string,
  offset: number
}) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(updateRouteOffset(offset))
    dispatch(fetchRouteDetails(namespace))
  }
}
