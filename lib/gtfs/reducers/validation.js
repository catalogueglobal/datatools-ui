// @flow

import update from 'react-addons-update'

import {getEntityGraphQLRoot, getEntityIdField} from '../../gtfs/util'
import type {Action} from '../../types/actions'
import type {ValidationState} from '../../types/reducers'

export const defaultState = {
  fetchStatus: {
    fetched: false,
    fetching: false,
    error: false
  },
  data: {}
}

export default function reducer (
  state: ValidationState = defaultState,
  action: Action
): ValidationState {
  switch (action.type) {
    case 'SET_ACTIVE_FEEDVERSION':
      return defaultState
    case 'FETCH_GRAPHQL_ROUTES':
      return {
        fetchStatus: {
          fetched: false,
          fetching: true,
          error: false
        },
        data: {}
      }
    case 'FETCH_GRAPHQL_ROUTES_REJECTED':
      return update(state, {
        fetchStatus: {
          $set: {
            fetched: false,
            fetching: false,
            error: true
          }
        }
      })
    case 'RECEIVE_GTFS_ENTITIES':
      const {data, editor, component} = action.payload
      if (editor) {
        // Ignore entity fetches for the editor
        return state
      }
      const entities = data.feed[getEntityGraphQLRoot(component)]
      const lookup = {}
      entities.forEach(entity => {
        const id = entity[getEntityIdField(component)]
        lookup[`${component}:${id}`] = entity
      })
      return update(state, {
        data: {$merge: lookup}
      })
    default:
      return state
  }
}
