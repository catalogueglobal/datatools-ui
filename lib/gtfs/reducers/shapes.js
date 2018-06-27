// @flow

export type ShapesState = {
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

export default function reducer (state: ShapesState = defaultState, action: any): ShapesState {
  switch (action.type) {
    case 'SET_ACTIVE_FEEDVERSION':
      return defaultState
    case 'FETCH_GRAPHQL_SHAPES_PENDING':
      return {
        fetchStatus: {
          fetched: false,
          fetching: true,
          error: false
        },
        data: []
      }
    case 'FETCH_GRAPHQL_SHAPES_REJECTED':
      return {
        fetchStatus: {
          fetched: false,
          fetching: false,
          error: true
        },
        data: []
      }
    case 'FETCH_GRAPHQL_SHAPES_FULFILLED':
      return {
        fetchStatus: {
          fetched: true,
          fetching: false,
          error: false
        },
        data: action.payload
      }
    default:
      return state
  }
}
