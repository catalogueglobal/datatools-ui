// @flow

import { connect } from 'react-redux'

import StopLayout from '../components/StopLayout'
import { updatePatternFilter } from '../../../../gtfs/actions/filter'
import {
  patternDateTimeFilterChange,
  patternRouteFilterChange
} from '../../../../gtfs/actions/patterns'
import { fetchRoutes } from '../../../../gtfs/actions/routes'
import { getFilteredStops } from '../../../selectors'

import type {Connector} from 'react-redux'

import type {Props} from '../components/StopLayout'
import type {AppState, dispatchFn} from '../../../../types'

type OwnProps = {
  selectTab: (string) => void,
  tableOptions: any,
  version: any
}

const mapStateToProps = (state: AppState, ownProps: OwnProps) => {
  const {gtfs} = state
  const {filter, patterns, routes} = gtfs
  const {patternFilter, routeFilter} = filter

  return {
    patternFilter,
    patterns: patterns.data.patterns,
    routeFilter,
    routes: routes.allRoutes,
    stops: getFilteredStops(state)
  }
}

const mapDispatchToProps = (dispatch: dispatchFn, ownProps: OwnProps) => {
  const {namespace} = ownProps.version
  return {
    onComponentMount: (initialProps) => {
      if (!initialProps.routes.fetchStatus.fetched) {
        dispatch(fetchRoutes(namespace))
      }
    },
    dateTimeFilterChange: () => {
      dispatch(patternDateTimeFilterChange(namespace))
    },
    patternFilterChange: (pattern) => {
      dispatch(updatePatternFilter(pattern && pattern.pattern_id))
    },
    routeFilterChange: (route) => {
      dispatch(patternRouteFilterChange(namespace, route && route.route_id))
    }
  }
}

const connnector: Connector<OwnProps, Props> = connect(
  mapStateToProps,
  mapDispatchToProps
)

export default connnector(StopLayout)
