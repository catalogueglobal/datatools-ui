import update from 'react-addons-update'

const defaultState = {
  fetchStatus: {
    fetched: false,
    fetching: false,
    error: false
  },
  interval: 10,
  data: {},
  active: {}
}

export default function reducer (state = defaultState, action) {
  switch (action.type) {
    case 'SET_ACTIVE_FEEDVERSION':
      return defaultState
    case 'SET_ACTIVE_VEHICLE':
      return update(state, {
        active: {vehicle: {$set: action.payload}}
      })
    case 'SET_ACTIVE_UPDATE':
      return update(state, {
        active: {update: {$set: action.payload}}
      })
    case 'SET_ACTIVE_ALERT':
      return update(state, {
        active: {alert: {$set: action.payload}}
      })
    case 'SET_REAL_TIME_MONITOR':
      return update(state, {timer: {$set: action.payload.timer}})
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
    case 'FETCH_REAL_TIME_FULFILLED':
      return update(state, {
        fetchStatus: {$set: {
          fetched: true,
          fetching: false,
          error: false
        }},
        data: {$merge: action.payload}
      })
    case 'FETCH_VEHICLE_POSITIONS_FULFILLED':
      return update(state, {
        fetchStatus: {$set: {
          fetched: true,
          fetching: false,
          error: false
        }},
        data: {vehiclePositions: {$set: action.payload}}
      })
    case 'FETCH_SERVICE_ALERTS_FULFILLED':
      return update(state, {
        fetchStatus: {$set: {
          fetched: true,
          fetching: false,
          error: false
        }},
        data: {vehiclePositions: {$set: action.payload}}
      })
    case 'FETCH_TRIP_UPDATES_FULFILLED':
      return update(state, {
        fetchStatus: {$set: {
          fetched: true,
          fetching: false,
          error: false
        }},
        data: {vehiclePositions: {$set: action.payload}}
      })
    default:
      return state
  }
}
