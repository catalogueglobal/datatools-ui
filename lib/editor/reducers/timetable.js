// @flow

import update from 'react-addons-update'
import objectPath from 'object-path'
import clone from 'lodash/cloneDeep'

import { sortAndFilterTrips } from '../util'
import { isTimeFormat } from '../util/timetable'
import {resequenceStops} from '../util/map'

export type TimetableState = {
  status: {
    fetched: boolean,
    error: boolean,
    fetching: boolean
  },
  columns: Array<any>,
  trips: Array<any>,
  edited: Array<any>,
  selected: Array<any>,
  hideDepartureTimes: boolean,
  offset: any
}

export const defaultState = {
  status: {
    fetched: false,
    error: false,
    fetching: false
  },
  columns: [],
  trips: [],
  edited: [],
  selected: [],
  hideDepartureTimes: false,
  offset: null
}

const timetable = (state: TimetableState = defaultState, action: any): TimetableState => {
  switch (action.type) {
    case 'CLEAR_GTFSEDITOR_CONTENT':
      return defaultState
    case 'SETTING_ACTIVE_GTFS_ENTITY': {
      const {subSubEntityId} = action.payload
      if (subSubEntityId !== state.status.scheduleId) {
        // If the schedule ID has changed, reset the state to default.
        return {
          ...defaultState,
          status: {
            fetched: false,
            error: false,
            fetching: false,
            scheduleId: subSubEntityId
          }
        }
      } else {
        // Otherwise, do not impact the state.
        return state
      }
    }
    case 'REQUESTING_TRIPS_FOR_CALENDAR':
      return update(state, {
        status: {
          fetched: {$set: false},
          error: {$set: false},
          fetching: {$set: true}
        }
      })
    case 'RECEIVE_TRIPS_FOR_CALENDAR': {
      const {trips, pattern} = action.payload
      const clonedTrips = clone(sortAndFilterTrips(trips, pattern.use_frequency))
        .map(trip => {
          return {
            ...trip,
            // Ensure that stop sequences are zero-based if/when they are saved.
            stopTimes: trip.stopTimes.map(resequenceStops)
          }
        })
      return update(state, {
        trips: {$set: clonedTrips},
        status: {
          fetched: {$set: true},
          fetching: {$set: false}
        },
        edited: {$set: []}
      })
    }
    case 'OFFSET_ROWS': {
      const trips = clone(state.trips)
      const editedRows = []
      // console.log(`Offsetting ${action.payload.rowIndexes.length} rows by ${action.payload.offset} seconds`)
      for (var i = 0; i < action.payload.rowIndexes.length; i++) {
        editedRows.push(action.payload.rowIndexes[i])
        for (var j = 0; j < state.columns.length; j++) {
          const col = state.columns[j]
          const path = `${action.payload.rowIndexes[i]}.${col.key}`
          if (isTimeFormat(col.type)) {
            const currentVal = objectPath.get(trips, path)
            const value = currentVal + (action.payload.offset % 86399) // ensure seconds does not exceed 24 hours
            objectPath.set(trips, path, value)
          }
        }
      }
      return update(state, {
        trips: {$set: trips},
        edited: {$push: editedRows}
      })
    }
    case 'SET_TIMETABLE_OFFSET':
      return update(state, {
        offset: {$set: action.payload.seconds}
      })
    case 'UPDATE_TIMETABLE_CELL_VALUE': {
      const trips = clone(state.trips)
      objectPath.set(trips, action.payload.key, action.payload.value)
      return update(state, {
        trips: {$set: trips},
        edited: {$push: [action.payload.rowIndex]}
      })
    }
    case 'TOGGLE_ALL_TIMETABLE_ROW_SELECTION':
      const selected = []
      if (action.payload.active) {
        for (let i = 0; i < state.trips.length; i++) {
          selected.push(i)
        }
      }
      return update(state, {
        selected: {$set: selected}
      })
    case 'TOGGLE_DEPARTURE_TIMES':
      return update(state, {
        hideDepartureTimes: {$set: !state.hideDepartureTimes}
      })
    case 'ADD_NEW_TRIP':
      return update(state, {
        trips: {$push: [action.payload]},
        edited: {$push: [state.trips.length]}
      })
    case 'REMOVE_TRIPS':
      return update(state, {
        trips: {$splice: action.payload}
      })
    case 'TOGGLE_SINGLE_TIMETABLE_ROW_SELECTION':
      const selectIndex = state.selected.indexOf(action.payload.rowIndex)
      if (selectIndex === -1) {
        return update(state, {
          selected: {$push: [action.payload.rowIndex]}
        })
      } else {
        return update(state, {
          selected: {$splice: [[selectIndex, 1]]}
        })
      }
    default:
      return state
  }
}

export default timetable
