import update from 'react-addons-update'

import { getControlPoints } from '../util/gtfs'
import { CLICK_OPTIONS } from '../util'

const defaultState = {
  actions: [],
  addStops: false,
  afterIntersection: true,
  controlPoints: [],
  coordinatesHistory: [],
  currentDragId: null,
  distanceFromIntersection: 5,
  editGeometry: false,
  followStreets: true,
  intersectionStep: 2,
  onMapClick: CLICK_OPTIONS[0],
  patternCoordinates: null,
  showStops: true,
  showTooltips: true,
  snapToStops: true,
  stopInterval: 400
}

const editSettings = (state = defaultState, action) => {
  let stateUpdate, controlPoints, coordinates
  switch (action.type) {
    case 'ADD_CONTROL_POINT':
      controlPoints = [...state.controlPoints[state.controlPoints.length - 1]]
      controlPoints.splice(action.index, 0, action.controlPoint)
      return update(state, {
        controlPoints: {$push: [controlPoints]},
        actions: {$push: [action.type]}
      })
    case 'CONTROL_POINT_DRAG_START_OR_END':
      return update(state, {
        currentDragId: {$set: action.dragId}
      })
    case 'RECEIVE_TRIP_PATTERNS_FOR_ROUTE':
      // set controlPoints initially and then whenever isSnappingToStops changes
      if (action.activePattern) {
        coordinates = action.activePattern.shape && action.activePattern.shape.coordinates
        controlPoints = getControlPoints(action.activePattern, state.snapToStops)
      } else {
        controlPoints = []
      }
      return update(state, {
        controlPoints: {$set: [controlPoints]},
        patternCoordinates: {$set: coordinates},
        coordinatesHistory: {$set: [coordinates]}
      })
    case 'RESET_ACTIVE_GTFS_ENTITY':
      switch (action.component) {
        case 'trippattern':
          coordinates = state.coordinatesHistory[0]
          return update(state, {
            patternCoordinates: {$set: coordinates},
            coordinatesHistory: {$set: [coordinates]}
          })
        default:
          return state
      }
    case 'SAVED_TRIP_PATTERN':
      // set controlPoints initially and then whenever isSnappingToStops changes
      controlPoints = getControlPoints(action.tripPattern, state.snapToStops)
      coordinates = action.tripPattern && action.tripPattern.shape && action.tripPattern.shape.coordinates
      return update(state, {
        controlPoints: {$set: [controlPoints]},
        patternCoordinates: {$set: coordinates},
        coordinatesHistory: {$set: [coordinates]}
      })
    case 'SETTING_ACTIVE_GTFS_ENTITY':
      switch (action.subComponent) {
        case 'trippattern':
          controlPoints = getControlPoints(action.activeSubEntity, state.snapToStops)
          coordinates = action.activeSubEntity && action.activeSubEntity.shape && action.activeSubEntity.shape.coordinates
          stateUpdate = {
            controlPoints: {$set: [controlPoints]},
            patternCoordinates: {$set: coordinates}
          }
          if (coordinates) {
            stateUpdate.coordinatesHistory = {$set: [coordinates]}
          }
          return update(state, stateUpdate)
        default:
          return state
      }
    case 'UNDO_TRIP_PATTERN_EDITS':
      stateUpdate = {
        actions: {$splice: [[action.lastActionIndex, 1]]}
      }
      // certain trip pattern edits have different undo effects
      switch (action.lastActionType) {
        case 'ADD_CONTROL_POINT': // THIS IS AN UNDO ACTION
          // only splice controlPoints if there is more than one in the list
          // (to avoid all controlPoints disappearing if undo button is clicked in rapid succession)
          if (state.controlPoints.length > 1) {
            stateUpdate.controlPoints = {$splice: [[action.lastControlPointsIndex, 1]]}
          }
          break
        case 'UPDATE_CONTROL_POINTS': // THIS IS AN UNDO ACTION
          stateUpdate.controlPoints = {$splice: [[action.lastControlPointsIndex, 1]]}
          stateUpdate.coordinatesHistory = {$splice: [[action.lastCoordinatesIndex, 1]]}
          stateUpdate.patternCoordinates = {$set: action.lastCoordinates}
          break
      }
      return update(state, stateUpdate)
    case 'UPDATE_ACTIVE_GTFS_ENTITY':
      switch (action.component) {
        case 'trippattern':
          if (action.props && 'shape' in action.props) {
            // add previous coordinates to history
            coordinates = action.entity.shape && action.entity.shape.coordinates
            const newCoordinates = action.props.shape && action.props.shape.coordinates
            if (coordinates) {
              return update(state, {
                coordinatesHistory: {$push: [coordinates]},
                patternCoordinates: {$set: newCoordinates}
              })
            }
          }
          break
        default:
          return state
      }
      return state
    case 'UPDATE_CONTROL_POINTS':
      return update(state, {
        controlPoints: {$push: [action.newControlPoints]},
        actions: {$push: [action.type]}
      })
    case 'UPDATE_EDIT_SETTING':
      if (action.setting === 'editGeometry' && !state.editGeometry) {
        controlPoints = getControlPoints(action.activePattern, state.snapToStops)
        return update(state, {
          [action.setting]: {$set: action.value},
          controlPoints: {$set: [controlPoints]}
        })
      } else {
        return update(state, {
          [action.setting]: {$set: action.value}
        })
      }
    case 'UPDATE_PATTERN_COORDINATES':
      return update(state, {
        patternCoordinates: {$set: action.coordinates}
      })
    default:
      return state
  }
}

export default editSettings
