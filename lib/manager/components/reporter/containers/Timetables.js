// @flow

import { connect } from 'react-redux'

import TimetableLayout from '../components/TimetableLayout'
import { fetchRoutes } from '../../../../gtfs/actions/routes'
import {
  fetchTimetablesWithFilters,
  timetableDateTimeFilterChange,
  timetablePatternFilterChange,
  timetableRouteFilterChange,
  timetableShowArrivalToggle,
  timetableTimepointToggle
} from '../../../../gtfs/actions/timetables'
import {getTimetableData} from '../../../selectors'
import type {
  dispatchFn,
  AppState,
  RouteListItem,
  ValidationPattern
} from '../../../../types/reducers'

const mapStateToProps = (state: AppState, ownProps) => {
  const {gtfs} = state
  const {
    filter,
    patterns,
    routes,
    timetables
  } = gtfs

  return {
    filter,
    patterns,
    routes: routes.allRoutes,
    timetables,
    timetableTableData: getTimetableData(state)
  }
}

const mapDispatchToProps = (dispatch: dispatchFn, ownProps): any => {
  const {namespace} = ownProps.version
  return {
    onComponentMount: (initialProps) => {
      if (!initialProps.routes.fetchStatus.fetched) {
        dispatch(fetchRoutes(namespace))
      } else if (
        initialProps.routes.fetchStatus.fetched &&
        initialProps.patterns.fetchStatus.fetched &&
        !initialProps.timetables.fetchStatus.fetched
      ) {
        dispatch(fetchTimetablesWithFilters(namespace))
      }
    },
    routeFilterChange: (route: ?RouteListItem) => {
      dispatch(timetableRouteFilterChange(namespace, route && route.route_id))
    },
    patternFilterChange: (pattern: ?ValidationPattern) => {
      dispatch(timetablePatternFilterChange(namespace, pattern && pattern.pattern_id))
    },
    timetableDateTimeFilterChange: () => {
      dispatch(timetableDateTimeFilterChange(namespace))
    },
    showArrivalsToggle: () => { dispatch(timetableShowArrivalToggle(namespace)) },
    timepointFilterToggle: () => { dispatch(timetableTimepointToggle(namespace)) }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TimetableLayout)
