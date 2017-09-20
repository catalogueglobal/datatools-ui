import update from 'react-addons-update'

const defaultState = {
  fetchStatus: {
    fetched: false,
    fetching: false,
    error: false
  },
  data: []
}

export default function reducer (state = defaultState, action) {
  switch (action.type) {
    case 'SET_ACTIVE_FEEDVERSION':
      return defaultState
    case 'FETCH_GRAPHQL_TRIPS':
      return {
        fetchStatus: {
          fetched: false,
          fetching: true,
          error: false
        },
        data: []
      }
    case 'FETCH_GRAPHQL_TRIPS_REJECTED':
      return update(state, {
        fetchStatus: {
          $set: {
            fetched: false,
            fetching: false,
            error: true
          }
        }
      })
    case 'FETCH_GRAPHQL_TRIPS_FULFILLED':
      return update(state, {
        fetchStatus: {
          $set: {
            fetched: true,
            fetching: false,
            error: false
          }
        },
        data: {$push: action.payload.trips}
      })
    case 'FETCH_GRAPHQL_STOP_TIMES_FULFILLED':
      const {trips} = action.payload
      const data = {}
      trips.forEach(trip => {
        const tripIndex = state.data.findIndex(t => t.trip_id === trip.trip_id)
        if (tripIndex !== -1) {
          data[tripIndex] = {stop_times: {$set: trip.stop_times}}
        }
      })
      return update(state, {
        fetchStatus: {
          $set: {
            fetched: true,
            fetching: false,
            error: false
          }
        },
        data
      })
    case 'FETCH_GRAPHQL_ROUTES_FULFILLED':
      const arrays = action.data.routes
        .map(r => r.patterns && r.patterns.map(p => p.trips.map(t => {
          t.route_id = r.route_id
          t.pattern_id = p.pattern_id
          return t
        })))
      const arrays2 = [].concat.apply([], arrays)
      const arrays3 = [].concat.apply([], arrays2)
      return update(state, {
        fetchStatus: {
          $set: {
            fetched: true,
            fetching: false,
            error: false
          }
        },
        data: {$set: arrays3}
      })
    default:
      return state
  }
}
