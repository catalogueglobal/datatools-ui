import {createAction} from 'redux-actions'

import {setErrorMessage} from '../../manager/actions/status'
import {fetchTrips} from './trips'
import {secureFetch} from '../../common/actions'

export const receiveRealTime = createAction('FETCH_REAL_TIME_FULFILLED')
export const receiveVehiclePositions = createAction('FETCH_VEHICLE_POSITIONS_FULFILLED')
export const receiveTripUpdates = createAction('FETCH_TRIP_UPDATES_FULFILLED')
export const receiveServiceAlerts = createAction('FETCH_SERVICE_ALERTS_FULFILLED')

export const setActiveAlert = createAction('SET_ACTIVE_ALERT')
export const setActiveVehicle = createAction('SET_ACTIVE_VEHICLE')
export const setActiveUpdate = createAction('SET_ACTIVE_UPDATE')

export function startRealtimeMonitor (feedSource, msInterval = 5000) {
  return function (dispatch, getState) {
    stopCurrentTimer(getState())

    const timerFunction = () => dispatch(refreshGtfsRealtime(feedSource))

    timerFunction() // make an initial call right now
    const timer = setInterval(timerFunction, msInterval)
    dispatch(setRealtimeMonitor({timer}))
  }
}

export function refreshGtfsRealtime (feedSource) {
  return function (dispatch, getState) {
    dispatch(refreshVehiclePositions(feedSource))
    // dispatch(refreshTripUpdates(feedSource))
    dispatch(refreshServiceAlerts(feedSource))
  }
}

const setRealtimeMonitor = createAction('SET_REAL_TIME_MONITOR')

export function stopRealtimeMonitor () {
  return function (dispatch, getState) {
    stopCurrentTimer(getState())
    dispatch(setRealtimeMonitor({timer: null}))
  }
}

function stopCurrentTimer (state) {
  const {timer} = state.gtfs.realtime
  if (timer) clearInterval(timer)
}

export function refreshVehiclePositions (feedSource) {
  return function (dispatch, getState) {
    const {vehiclePositionsUrl} = feedSource || {}
    vehiclePositionsUrl && dispatch(secureFetch(`/api/manager/secure/vehiclepositions/${feedSource.id}`))
      .then(res => res.json())
      .then(vehiclePositions => {
        const {trips} = getState().gtfs
        const tripIds = trips.data.map(t => t.trip_id)
        dispatch(receiveRealTime({vehiclePositions}))

        // TODO: make sure reducer is merging any new trips
        // const tripId = vehiclePositions.entity
        //   .map(entity => entity.vehicle && entity.vehicle.trip && entity.vehicle.trip.trip_id)
        //   .filter(id => id && tripIds.indexOf(id) === -1)
        // // console.log(tripId)
        // if (tripId.length > 0) dispatch(fetchTrips(feedSource.id, tripId))
      })
      .catch(err => console.log(`Error fetching vehicle positions!`, err))
  }
}

export function refreshTripUpdates (feedSource) {
  return function (dispatch, getState) {
    const {tripUpdatesUrl} = feedSource || {}
    tripUpdatesUrl && dispatch(secureFetch(`/api/manager/secure/tripupdates/${feedSource.id}`))
      .then(res => res.json())
      .then(tripUpdates => dispatch(receiveRealTime({tripUpdates})))
      .catch(err => console.log(`Error fetching trip updates!`, err))
  }
}

export function refreshServiceAlerts (feedSource) {
  return function (dispatch, getState) {
    const {serviceAlertsUrl} = feedSource || {}
    serviceAlertsUrl && dispatch(secureFetch(`/api/manager/secure/servicealerts/${feedSource.id}`))
      .then(res => res.json())
      .then(serviceAlerts => dispatch(receiveRealTime({serviceAlerts})))
      .catch(err => console.log(`Error fetching service alerts!`, err))
  }
}
