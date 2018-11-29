// @flow

import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {snakeCaseKeys} from '../../common/util/map-keys'
import {generateUID} from '../../common/util/util'
import {fetchGTFSEntities} from '../../manager/actions/versions'
import {getEditorNamespace} from '../util/gtfs'
import {resequenceStops, resequenceShapePoints} from '../util/map'
import {entityIsNew} from '../util/objects'
import type {ControlPoint, Pattern, PatternStop} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

import {fetchTripCounts} from './trip'
import {resetActiveGtfsEntity, savedGtfsEntity, updateActiveGtfsEntity, updateEditSetting} from './active'

const savedTripPattern = createVoidPayloadAction('SAVED_TRIP_PATTERN')
export const setActivePatternSegment = createAction(
  'SET_ACTIVE_PATTERN_SEGMENT',
  (payload: number) => payload
)
export const setActiveStop = createAction(
  'SET_ACTIVE_PATTERN_STOP',
  (payload: { id: null | string, index: null | number }) => payload
)
const undoTripPatternEdits = createAction(
  'UNDO_TRIP_PATTERN_EDITS',
  (payload: {
    controlPoints: null | Array<ControlPoint>,
    patternSegments: null | Array<[number, number]>
  }) => payload
)

export type EditorTripPatternActions = ActionType<typeof savedTripPattern> |
  ActionType<typeof setActivePatternSegment> |
  ActionType<typeof setActiveStop> |
  ActionType<typeof undoTripPatternEdits>

/**
 * Convenience action to update active pattern's pattern stops. Handles proper
 * resequencing of pattern stops to ensure they are zero-based, incrementing
 * values.
 */
export function updatePatternStops (
  pattern: Pattern,
  patternStops: Array<PatternStop>
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const sortedPatternStops = patternStops.map(resequenceStops)
    dispatch(updateActiveGtfsEntity({
      component: 'trippattern',
      entity: pattern,
      props: {patternStops: sortedPatternStops}
    }))
  }
}

export function undoActiveTripPatternEdits () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    // Get most recent set of control points and pattern segments.
    const {past} = getState().editor.editSettings
    const {controlPoints, patternSegments} = past[past.length - 1]
    // Action signals to the redux-undo library to reset to the past state. The
    // control points and pattern segments are ONLY used by the data reducer to
    // reset the active trip pattern shape points.
    dispatch(undoTripPatternEdits({controlPoints, patternSegments}))
  }
}

export function togglePatternEditing () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {editGeometry} = getState().editor.editSettings.present
    dispatch(updateEditSetting({
      setting: 'editGeometry',
      value: !editGeometry
    }))
  }
}

/**
 * Fetch all trip patterns for the feed. Used to display pattern shapes in map
 * layer.
 */
export function fetchTripPatterns (feedId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const namespace = getEditorNamespace(feedId, getState())
    return dispatch(fetchGTFSEntities({namespace, type: 'pattern', editor: true}))
  }
}

export function saveTripPattern (feedId: ?string, tripPattern: Pattern) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    if (!feedId) {
      console.warn('feedId not defined, unable to save trip pattern')
      return
    }
    const patternIsNew = entityIsNew(tripPattern)
    const {data} = getState().editor
    const sessionId = data.lock.sessionId || ''
    const method = patternIsNew ? 'post' : 'put'
    // Route ID needed for re-fetch is the ID field of the active entity (route)
    // NOTE: The pattern being saved is the active **sub**-entity.
    if (!data.active.entity) {
      console.warn('No active entity defined, unable to save trip pattern')
      return
    }
    const {id: routeId} = data.active.entity
    // Resequence shape points to ready shape_points for insertion into shapes
    // table. NOTE: if the pattern shape has been edited, the sequence should
    // already be correct. However, if it is unedited, it may not be zero-based,
    // so we prevent that here.
    // NOTE: This must be applied before snake case-ing (because
    // resequenceShapePoints updates the camelCase field shapePtSequence).
    tripPattern.patternStops = tripPattern.patternStops.map(resequenceStops)
    if (!tripPattern.shapeId) {
      // If trip pattern has no shape ID (e.g., if the pattern was imported
      // without shapes), generate one and assign shape points to the new ID.
      const shapeId = generateUID()
      tripPattern.shapeId = shapeId
      tripPattern.shapePoints = tripPattern.shapePoints.map(sp => ({...sp, shapeId}))
    }
    tripPattern.shapePoints = tripPattern.shapePoints.map(resequenceShapePoints)
    const patternData = snakeCaseKeys(tripPattern)
    // Shape points must be assigned to shapes field in order to match back end
    // model and apply updates.
    patternData.shapes = patternData.shape_points
    // Remove large fields that are unrecognized by the back end.
    delete patternData.shape_points
    delete patternData.shape
    const url = patternIsNew
      ? `/api/editor/secure/pattern?feedId=${feedId}&sessionId=${sessionId}`
      : `/api/editor/secure/pattern/${tripPattern.id}?feedId=${feedId}&sessionId=${sessionId}`
    patternData.id = patternIsNew ? null : tripPattern.id
    return dispatch(secureFetch(url, method, patternData))
      .then(res => res.json())
      .then(newTripPattern => {
        dispatch(savedGtfsEntity())
        // Signals to undo history that pattern history should be cleared.
        dispatch(savedTripPattern())
        const namespace = getEditorNamespace(feedId, getState())
        // // Refetch entity and replace in store
        return dispatch(fetchGTFSEntities({
          namespace,
          id: routeId,
          type: 'route',
          editor: true,
          replaceNew: patternIsNew,
          patternId: newTripPattern.id
        }))
      })
      .catch(err => {
        console.log(err)
        dispatch(resetActiveGtfsEntity({
          entity: tripPattern,
          component: 'trippattern'
        }))
      })
  }
}

/**
 * Deletes all trips for a given pattern ID. This is used to clear the trips for
 * a pattern if/when a pattern is changed from frequency-based to timetable-baed.
 */
export function deleteAllTripsForPattern (feedId: string, patternId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const sessionId = getState().editor.data.lock.sessionId || ''
    const url = `/api/editor/secure/pattern/${patternId}/trips?feedId=${feedId}&sessionId=${sessionId}`
    return dispatch(secureFetch(url, 'delete'))
      .then(res => res.json())
      .then(json => json && json.result === 'OK')
      .then(() => dispatch(fetchTripCounts(feedId)))
  }
}
