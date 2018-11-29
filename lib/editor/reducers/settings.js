// @flow

import update from 'react-addons-update'
import type {ActionType} from 'redux-actions'

import {settingActiveGtfsEntity, updateEditSetting} from '../actions/active'
import {
  controlPointDragOrEnd,
  updatePatternGeometry,
  updateTempPatternGeometry
} from '../actions/map'
import { CLICK_OPTIONS } from '../util'
import type {EditSettingsState} from '../../types/reducers'

export const defaultState = {
  addStops: false,
  afterIntersection: true,
  controlPoints: null,
  currentDragId: null,
  distanceFromIntersection: 5,
  editGeometry: false,
  followStreets: true,
  hideInactiveSegments: false,
  intersectionStep: 2,
  onMapClick: CLICK_OPTIONS[0],
  patternSegments: null,
  shapePoints: null,
  showStops: true,
  showTooltips: true,
  hideStopHandles: true,
  stopInterval: 400
}

export const reducers = {
  'CONTROL_POINT_DRAG_START_OR_END' (
    state: EditSettingsState,
    action: ActionType<typeof controlPointDragOrEnd>
  ): EditSettingsState {
    return update(state, {
      currentDragId: {$set: action.payload}
    })
  },
  'SETTING_ACTIVE_GTFS_ENTITY' (
    state: EditSettingsState,
    action: ActionType<typeof settingActiveGtfsEntity>
  ): EditSettingsState {
    return defaultState
  },
  'UPDATE_TEMP_PATTERN_GEOMETRY' (
    state: EditSettingsState,
    action: ActionType<typeof updateTempPatternGeometry>
  ): EditSettingsState {
    return update(state, {
      controlPoints: {$set: action.payload.controlPoints},
      patternSegments: {$set: action.payload.patternSegments}
    })
  },
  'UPDATE_PATTERN_GEOMETRY' (
    state: EditSettingsState,
    action: ActionType<typeof updatePatternGeometry>
  ): EditSettingsState {
    return update(state, {
      controlPoints: {$set: action.payload.controlPoints},
      patternSegments: {$set: action.payload.patternSegments}
    })
  },
  'UPDATE_EDIT_SETTING' (
    state: EditSettingsState,
    action: ActionType<typeof updateEditSetting>
  ): EditSettingsState {
    const {setting, value} = action.payload
    return update(state, { [setting]: {$set: value} })
  }
}
