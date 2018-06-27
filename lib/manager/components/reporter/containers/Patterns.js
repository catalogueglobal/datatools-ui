// @flow

import { connect } from 'react-redux'

import PatternLayout from '../components/PatternLayout'
import { updatePatternFilter } from '../../../../gtfs/actions/filter'
import {
  patternDateTimeFilterChange,
  patternRouteFilterChange
} from '../../../../gtfs/actions/patterns'
import { fetchRoutes } from '../../../../gtfs/actions/routes'
import { timetablePatternFilterChange } from '../../../../gtfs/actions/timetables'
import { getPatternData } from '../../../selectors'

import type {Route} from '../../../../gtfs/reducers/routes'
import type {AppState, dispatchFn} from '../../../../types'

const mapStateToProps = (state: AppState, ownProps) => {
  return {
    fetchStatus: state.gtfs.patterns.fetchStatus,
    routes: state.gtfs.routes.allRoutes,
    routeFilter: state.gtfs.filter.routeFilter,
    patternData: getPatternData(state)
  }
}

const mapDispatchToProps = (dispatch: dispatchFn, ownProps) => {
  const {namespace} = ownProps.version
  return {
    onComponentMount: (initialProps) => {
      if (!initialProps.routes.fetchStatus.fetched) {
        dispatch(fetchRoutes(namespace))
      }
    },
    routeFilterChange: (route: ?Route) => {
      dispatch(patternRouteFilterChange(namespace, route && route.route_id))
    },
    patternDateTimeFilterChange: () => {
      dispatch(patternDateTimeFilterChange(namespace))
    },
    viewStops: (patternId: ?string) => {
      dispatch(updatePatternFilter(patternId))
      ownProps.selectTab('stops')
    },
    viewTrips: (patternId: ?string) => {
      dispatch(timetablePatternFilterChange(namespace, patternId))
      ownProps.selectTab('timetables')
    }
  }
}

const Patterns = connect(
  mapStateToProps,
  mapDispatchToProps
)(PatternLayout)

export default Patterns
