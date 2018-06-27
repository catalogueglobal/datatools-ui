// @flow

import update from 'react-addons-update'

import {getEntityName} from '../../editor/util/gtfs'

import type {createAction} from '../../types'

export type RouteDetailsData = {
  numRoutes: number,
  routes: Array<{
    route_id: string,
    route_short_name: string,
    route_long_name: string,
    route_desc: ?string,
    stops: Array<{
      stop_id: string
    }>,
    trips: Array<{
      pattern_id: string,
      stop_times: Array<{
        arrival_time: number,
        departure_time: number
      }>
    }>
  }>
}

export type Route = {
  route_id: string,
  route_long_name: ?string,
  route_name: string,
  route_short_name: ?string
}

export type AllRoutes = Array<Route>

export type RoutesState = {
  allRoutes: {
    fetchStatus: {
      fetched: boolean,
      fetching: boolean,
      error: boolean
    },
    data: null | AllRoutes
  },
  routeDetails: {
    fetchStatus: {
      fetched: boolean,
      fetching: boolean,
      error: boolean
    },
    data: null | RouteDetailsData
  }
}

export const defaultState = {
  allRoutes: {
    fetchStatus: {
      fetched: false,
      fetching: false,
      error: false
    },
    data: []
  },
  routeDetails: {
    fetchStatus: {
      fetched: false,
      fetching: false,
      error: false
    },
    data: null
  }
}

export default function reducer (
  state: RoutesState = defaultState,
  action: createAction
): RoutesState {
  switch (action.type) {
    case 'SET_ACTIVE_FEEDVERSION':
      return defaultState
    case 'FETCH_GRAPHQL_ROUTES':
      return update(state, {
        allRoutes: {
          $set: {
            fetchStatus: {
              fetched: false,
              fetching: true,
              error: false
            },
            data: []
          }
        }
      })
    case 'FETCH_GRAPHQL_ROUTES_REJECTED':
      return update(state, {
        allRoutes: {
          fetchStatus: {
            $set: {
              fetched: false,
              fetching: false,
              error: true
            }
          }
        }
      })
    case 'FETCH_GRAPHQL_ROUTES_FULFILLED':
      return update(state, {
        allRoutes: {
          $set: {
            fetchStatus: {
              fetched: true,
              fetching: false,
              error: false
            },
            data: action.payload.map(route => {
              return {
                ...route,
                route_name: getEntityName(route)
              }
            })
          }
        }
      })
    case 'FETCH_GRAPHQL_ROUTE_DETAILS':
      return update(state, {
        routeDetails: {
          $set: {
            fetchStatus: {
              fetched: false,
              fetching: true,
              error: false
            },
            data: null
          }
        }
      })
    case 'FETCH_GRAPHQL_ROUTE_DETAILS_REJECTED':
      return update(state, {
        routeDetails: {
          fetchStatus: {
            $set: {
              fetched: false,
              fetching: false,
              error: true
            }
          }
        }
      })
    case 'FETCH_GRAPHQL_ROUTE_DETAILS_FULFILLED':
      return update(state, {
        routeDetails: {
          $set: {
            fetchStatus: {
              fetched: true,
              fetching: false,
              error: false
            },
            data: action.payload
          }
        }
      })
    case 'UPDATE_GTFS_DATETIME_FILTER':
      if (action.payload.hasOwnProperty('date')) {
        return update(state, {
          routeDetails: {
            $set: {
              fetchStatus: {
                fetched: false,
                fetching: false,
                error: false
              },
              data: null
            }
          }
        })
      } else {
        return state
      }
    default:
      return state
  }
}
