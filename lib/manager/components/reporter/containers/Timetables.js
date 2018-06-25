// @flow

import { connect } from 'react-redux'

import TimetableLayout from '../components/TimetableLayout'
import { fetchRoutes } from '../../../../gtfs/actions/routes'
import {
  timetableDateTimeFilterChange,
  timetablePatternFilterChange,
  timetableRouteFilterChange,
  timetableShowArrivalToggle,
  timetableTimepointToggle
} from '../../../../gtfs/actions/timetables'
import {getTimetableData} from '../../../selectors'

const mapStateToProps = (state, ownProps) => {
  const {gtfs} = state
  const {
    filter,
    patterns,
    routes,
    services,
    timetables
  } = gtfs
  return {
    filter,
    patterns,
    routes,
    services,
    timetables,
    timetableTableData: getTimetableData(state)
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const {namespace} = ownProps.version
  return {
    onComponentMount: (initialProps) => {
      if (!initialProps.routes.fetchStatus.fetched) {
        dispatch(fetchRoutes(namespace))
      }
    },
    routeFilterChange: (newValue) => {
      dispatch(timetableRouteFilterChange(namespace, newValue))
    },
    patternFilterChange: (newValue) => {
      dispatch(timetablePatternFilterChange(namespace, newValue))
    },
    timetableDateTimeFilterChange: () => {
      dispatch(timetableDateTimeFilterChange(namespace))
    },
    showArrivalsToggle: () => { dispatch(timetableShowArrivalToggle(namespace)) },
    timepointFilterToggle: () => { dispatch(timetableTimepointToggle(namespace)) }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TimetableLayout)
