import {connect} from 'react-redux'

import {refreshVehiclePositions, startRealtimeMonitor, stopRealtimeMonitor} from '../../../../gtfs/actions/realtime'
import {fetchRoutes} from '../../../../gtfs/actions/routes'
import {fetchPatterns} from '../../../../gtfs/actions/patterns'
import {fetchTrips} from '../../../../gtfs/actions/trips'
import RealTimeLayout from '../components/RealTimeLayout'

const mapStateToProps = (state, ownProps) => {
  const {feed, routes, stops, trips} = state.gtfs
  const {serviceAlerts, tripUpdates, vehiclePositions} = state.gtfs.realtime.data
  return {
    feed,
    routes,
    serviceAlerts,
    stops,
    trips,
    tripUpdates,
    vehiclePositions
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const {feedSource, id} = ownProps.version
  const feedId = id.split('.zip')[0]
  return {
    onComponentMount: (initialProps) => {
      // TODO: change to begin
      dispatch(startRealtimeMonitor(feedSource))
      if (!initialProps.routes.fetchStatus.fetched) {
        // include patterns in fetch
        dispatch(fetchRoutes(feedId, true))
      }
    },
    onComponentUnmount: (initialProps) => {
      // TODO: change to begin
      console.log('unmounting realtime')
      dispatch(stopRealtimeMonitor())
    },
    refreshVehiclePositions: (feedSource) => dispatch(refreshVehiclePositions(feedSource))
  }
}

const RealTime = connect(
  mapStateToProps,
  mapDispatchToProps
)(RealTimeLayout)

export default RealTime
