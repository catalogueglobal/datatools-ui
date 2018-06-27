// @flow

import { combineReducers } from 'redux'
import {handleActions} from 'redux-actions'
import undoable, {includeAction} from 'redux-undo'

import data from './data'
import * as settings from './settings'
import * as mapState from './mapState'
import timetable from './timetable'

import type {DataState} from './data'
import type {EditSettingsState} from './settings'
import type {MapState} from './mapState'
import type {TimetableState} from './timetable'

export type EditorState = {
  data: DataState,
  editSettings: EditSettingsState,
  mapState: MapState,
  timetable: TimetableState
}

export default combineReducers({
  data,
  editSettings: undoable(
    handleActions(settings.reducers, settings.defaultState),
    { undoType: 'UNDO_TRIP_PATTERN_EDITS',
      filter: includeAction(['UPDATE_PATTERN_GEOMETRY']),
      clearHistoryType: [
        'TOGGLE_PATTERN_EDITING',
        'SAVED_TRIP_PATTERN'
      ],
      initialState: settings.defaultState
    }
  ),
  mapState: handleActions(mapState.reducers, mapState.defaultState),
  timetable
})
