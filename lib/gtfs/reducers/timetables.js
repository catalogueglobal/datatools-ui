// @flow

import type {createAction} from '../../types'

type State = {
  fetchStatus: {
    fetched: boolean,
    fetching: boolean,
    error: boolean
  },
  data: Array<any>
}

const defaultState = {
  fetchStatus: {
    fetched: false,
    fetching: false,
    error: false
  },
  data: []
}

export default function reducer (
  state: State = defaultState,
  action: createAction
): State {
  switch (action.type) {
    case 'SET_ACTIVE_FEEDVERSION':
      return defaultState
    case 'FETCH_GRAPHQL_TIMETABLES':
      return {
        fetchStatus: {
          fetched: false,
          fetching: true,
          error: false
        },
        data: []
      }
    case 'FETCH_GRAPHQL_TIMETABLES_REJECTED':
      return {
        fetchStatus: {
          fetched: false,
          fetching: false,
          error: true
        },
        data: []
      }
    case 'FETCH_GRAPHQL_TIMETABLES_FULFILLED':
      const {data} = action.payload

      return {
        fetchStatus: {
          fetched: true,
          fetching: false,
          error: false
        },
        data
      }
    default:
      return state
  }
}
