// @flow

import {connect} from 'react-redux'

import ShowAllRoutesOnMapFilter from '../components/ShowAllRoutesOnMapFilter'
import {toggleShowAllRoutesOnMap} from '../actions/shapes'

import type {AppState, dispatchFn} from '../../types'

const mapStateToProps = (state: AppState, ownProps) => {
  return {
    showAllRoutesOnMap: state.gtfs.filter.showAllRoutesOnMap
  }
}

const mapDispatchToProps = (dispatch: dispatchFn, ownProps) => {
  return {
    toggleShowAllRoutesOnMap: () => dispatch(toggleShowAllRoutesOnMap(
      ownProps.namespace
    ))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ShowAllRoutesOnMapFilter)
