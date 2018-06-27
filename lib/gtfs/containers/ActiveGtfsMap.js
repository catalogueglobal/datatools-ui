// @flow

import {connect} from 'react-redux'

import GtfsMap from '../components/GtfsMap'
import {clearGtfsElements, refreshGtfsElements} from '../actions/general'
import {updateMapState} from '../actions/filter'
import {fetchFeedVersionIsochrones} from '../../manager/actions/versions'
import {getFilteredStops} from '../../manager/selectors'

import type {AppState} from '../../types'

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
    stops: getFilteredStops(state)
  }
}

const mapDispatchToProps = {
  updateMapState,
  clearGtfsElements,
  refreshGtfsElements,
  fetchIsochrones: fetchFeedVersionIsochrones
}

const ActiveGtfsMap = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsMap)

export default ActiveGtfsMap
