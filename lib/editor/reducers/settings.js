// @flow

import update from 'react-addons-update'

import { CLICK_OPTIONS } from '../util'

export type EditSettingsState = {
  addStops: boolean,
  afterIntersection: boolean,
  controlPoints: any,
  currentDragId: any,
  distanceFromIntersection: number,
  editGeometry: boolean,
  followStreets: boolean,
  hideInactiveSegments: boolean,
  intersectionStep: number,
  onMapClick: any,
  patternSegments: any,
  showStops: boolean,
  showTooltips: boolean,
  hideStopHandles: boolean,
  stopInterval: number
}

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
  showStops: true,
  showTooltips: true,
  hideStopHandles: true,
  stopInterval: 400
}

export const reducers = {
  'CONTROL_POINT_DRAG_START_OR_END' (state: EditSettingsState, action: any): EditSettingsState {
    return update(state, {
      currentDragId: {$set: action.payload}
    })
  },
  'TOGGLE_PATTERN_EDITING' (state: EditSettingsState, action: any): EditSettingsState {
    return {
      ...defaultState,
      editGeometry: action.payload
    }
  },
  'SETTING_ACTIVE_GTFS_ENTITY' (state: EditSettingsState, action: any): EditSettingsState {
    return defaultState
  },
  'UPDATE_TEMP_PATTERN_GEOMETRY' (state: EditSettingsState, action: any): EditSettingsState {
    return update(state, {
      controlPoints: {$set: action.payload.controlPoints},
      patternSegments: {$set: action.payload.patternSegments}
    })
  },
  'UPDATE_PATTERN_GEOMETRY' (state: EditSettingsState, action: any): EditSettingsState {
    return update(state, {
      controlPoints: {$set: action.payload.controlPoints},
      patternSegments: {$set: action.payload.patternSegments}
    })
  },
  'UPDATE_EDIT_SETTING' (state: EditSettingsState, action: any): EditSettingsState {
    return update(state, {
      [action.setting]: {$set: action.value}
    })
  }
}
