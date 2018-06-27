// @flow

import type {createAction} from '../../types'

export type Stop = {
  stop_id: string,
  stop_name: string
}

export type TimetablesState = {
  fetchStatus: {
    fetched: boolean,
    fetching: boolean,
    error: boolean
  },
  data: null | {
    feed: ?{
      patterns: Array<{
        stops: Array<Stop>,
        trips: Array<{
          direction_id: number,
          pattern_id: string,
          service_id: string,
          stop_times: Array<{
            arrival_time: ?number,
            departure_time: ?number,
            stop_id: string,
            stop_sequence: number,
            timepoint: ?boolean
          }>,
          trip_headsign: string,
          trip_id: string,
          trip_short_name: ?string
        }>
      }>
    }
  }
}

export const defaultState = {
  fetchStatus: {
    fetched: false,
    fetching: false,
    error: false
  },
  data: null
}

export default function reducer (
  state: TimetablesState = defaultState,
  action: createAction
): TimetablesState {
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
        data: null
      }
    case 'FETCH_GRAPHQL_TIMETABLES_REJECTED':
      return {
        fetchStatus: {
          fetched: false,
          fetching: false,
          error: true
        },
        data: null
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
