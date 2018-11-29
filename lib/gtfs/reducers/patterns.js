// @flow

import {getRouteName, mapPatternShape} from '../../editor/util/gtfs'
import type {Action} from '../../types/actions'
import type {PatternsState} from '../../types/reducers'

export const defaultState = {
  fetchStatus: {
    fetched: false,
    fetching: false,
    error: false
  },
  data: {
    patterns: [],
    stops: []
  }
}

export default function reducer (
  state: PatternsState = defaultState,
  action: Action
): PatternsState {
  switch (action.type) {
    case 'SET_ACTIVE_FEEDVERSION':
      return defaultState
    case 'FETCH_GRAPHQL_PATTERNS':
      return {
        fetchStatus: {
          fetched: false,
          fetching: true,
          error: false
        },
        data: {
          patterns: [],
          stops: []
        }
      }
    case 'FETCH_GRAPHQL_PATTERNS_REJECTED':
      return {
        fetchStatus: {
          fetched: false,
          fetching: false,
          error: true
        },
        data: {
          patterns: [],
          stops: []
        }
      }
    case 'RECEIVED_GTFS_ELEMENTS':
      return {
        fetchStatus: {
          fetched: true,
          fetching: false,
          error: false
        },
        data: {
          patterns: action.payload.patterns.map(mapPatternShape),
          stops: []
        }
      }
    case 'FETCH_GRAPHQL_PATTERNS_FULFILLED':
      const {routes} = action.payload
      const allPatterns = []

      // iterate over routes from graphql to set route name
      for (let i = 0; i < routes.length; i++) {
        const curRouteId = routes[i].route_id
        const curRouteName = getRouteName(routes[i])
        // iterate over patterns from graphql to add route ref fields
        for (let j = 0; j < routes[i].patterns.length; j++) {
          const curPattern = mapPatternShape(routes[i].patterns[j])
          curPattern.route_id = curRouteId
          curPattern.route_name = curRouteName
          allPatterns.push(curPattern)
        }
      }

      return {
        fetchStatus: {
          fetched: true,
          fetching: false,
          error: false
        },
        data: {
          patterns: allPatterns,
          stops: routes.length > 0 ? routes[0].stops : []
        }
      }
    case 'UPDATE_GTFS_DATETIME_FILTER':
      return action.payload.hasOwnProperty('date') ? defaultState : state
    default:
      return state
  }
}
