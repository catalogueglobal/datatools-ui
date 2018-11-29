// @flow

import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, fetchGraphQL} from '../../common/actions'
import {allRoutes, routeDetails} from '../../gtfs/util/graphql'
import type {
  dispatchFn,
  getStateFn,
  RouteDetailsData,
  RouteListItem
} from '../../types/reducers'

import {updateRouteOffset} from './filter'

// the route details includes more details about each route in order to display
// the route trip histogram.  Also, to ensure timely responses from the server
// the route details is paginated.  This is the main motivation for having two
// separate entities for dealing with routes

export const errorFetchingRouteDetails = createVoidPayloadAction(
  'FETCH_GRAPHQL_ROUTE_DETAILS_REJECTED'
)
export const errorFetchingRoutes = createVoidPayloadAction(
  'FETCH_GRAPHQL_ROUTES_REJECTED'
)
export const fetchingRouteDetails = createVoidPayloadAction(
  'FETCH_GRAPHQL_ROUTE_DETAILS'
)
export const fetchingRoutes = createVoidPayloadAction('FETCH_GRAPHQL_ROUTES')
const receiveRouteDetails = createAction(
  'FETCH_GRAPHQL_ROUTE_DETAILS_FULFILLED',
  (payload: {
    numRoutes: number,
    routes: Array<RouteDetailsData>
  }) => payload
)
const receiveRoutes = createAction(
  'FETCH_GRAPHQL_ROUTES_FULFILLED',
  (payload: Array<RouteListItem>) => payload
)

export type RouteActions = ActionType<typeof errorFetchingRouteDetails> |
  ActionType<typeof errorFetchingRoutes> |
  ActionType<typeof fetchingRouteDetails> |
  ActionType<typeof fetchingRoutes> |
  ActionType<typeof receiveRouteDetails> |
  ActionType<typeof receiveRoutes>

export function fetchRouteDetails (namespace: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {
      dateTimeFilter,
      routeLimit,
      routeOffset
    } = getState().gtfs.filter
    dispatch(fetchingRouteDetails())
    return dispatch(
      fetchGraphQL({
        query: routeDetails,
        variables: {
          date: dateTimeFilter.date,
          namespace,
          routeLimit,
          routeOffset
        }
      })
    )
      .then(data => {
        const {
          routes,
          row_counts: {
            routes: numRoutes
          }
        } = data.feed
        dispatch(receiveRouteDetails({numRoutes, routes}))
      })
  }
}

export function fetchRoutes (namespace: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(fetchingRoutes())
    return dispatch(fetchGraphQL({query: allRoutes, variables: {namespace}}))
      .then(data => dispatch(receiveRoutes(data.feed.routes)))
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
