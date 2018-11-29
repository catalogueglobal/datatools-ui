// @flow

import {connect} from 'react-redux'

import GtfsMap from '../components/GtfsMap'
import {refreshGtfsElements} from '../actions/general'
import {updateMapState} from '../actions/filter'
import {fetchFeedVersionIsochrones} from '../../manager/actions/versions'
import {getFilteredStops} from '../../manager/selectors'
import type {AppState} from '../../types/reducers'

const mapStateToProps = (state: AppState, ownProps) => {
  const {gtfs, routing, ui} = state
  const {filter, patterns, routes, shapes} = gtfs
  const {dateTimeFilter, map, patternFilter, showAllRoutesOnMap} = filter
  const {locationBeforeTransitions} = routing
  return {
    dateTime: dateTimeFilter,
    mapState: map,
    patternFilter,
    patterns: patterns.data.patterns,
    routes: routes.allRoutes.data,
    routing: locationBeforeTransitions && locationBeforeTransitions.pathname,
    shapes,
    showAllRoutesOnMap,
    sidebarExpanded: ui.sidebarExpanded,
    // If rendering GTFS map for a single feed version, use filtered stops
    // (from pattern or route currently displayed). Otherwise, if using map
    // for alerts, pass the stops taken from the stops reducer (map bounds
    // search).
    stops: ownProps.version ? getFilteredStops(state) : gtfs.stops.data
  }
}

const mapDispatchToProps = {
  updateMapState,
  refreshGtfsElements,
  fetchIsochrones: fetchFeedVersionIsochrones
}

const ActiveGtfsMap = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsMap)

export default ActiveGtfsMap
