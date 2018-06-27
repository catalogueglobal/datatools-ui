// @flow

import update from 'react-addons-update'

import {getEntityGraphQLRoot, getEntityIdField} from '../../gtfs/util'

export type ValidationState = {
  fetchStatus: {
    fetched: boolean,
    fetching: boolean,
    error: boolean
  },
  data: Array<any>
}

export const defaultState = {
  fetchStatus: {
    fetched: false,
    fetching: false,
    error: false
  },
  data: []
}

export default function reducer (state: ValidationState = defaultState, action: any): ValidationState {
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
        data: []
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
      entities.forEach(entity => {
        const id = entity[getEntityIdField(component)]
        entity._id = `${component}:${id}`
      })
      return update(state, {
        data: {$push: entities}
      })
    default:
      return state
  }
}
