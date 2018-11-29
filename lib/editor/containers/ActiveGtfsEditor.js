// @flow

import {connect} from 'react-redux'

import GtfsEditor from '../components/GtfsEditor'
import {fetchFeedSourceAndProject} from '../../manager/actions/feeds'
import {
  fetchTripPatterns,
  setActiveStop,
  setActivePatternSegment,
  undoActiveTripPatternEdits,
  updatePatternStops
} from '../actions/tripPattern'
import {
  removeStopFromPattern,
  addStopAtPoint,
  addStopAtIntersection,
  addStopAtInterval,
  addStopToPattern} from '../actions/map/stopStrategies'
import {
  handleControlPointDrag,
  handleControlPointDragEnd,
  handleControlPointDragStart,
  removeControlPoint,
  updateMapSetting,
  constructControlPoint
} from '../actions/map'
import {fetchTripsForCalendar} from '../actions/trip'
import {updateEditSetting,
  setActiveGtfsEntity,
  deleteGtfsEntity,
  updateActiveGtfsEntity,
  resetActiveGtfsEntity,
  clearGtfsContent,
  saveActiveGtfsEntity} from '../actions/active'
import {
  cloneGtfsEntity,
  fetchBaseGtfs,
  newGtfsEntity,
  newGtfsEntities,
  removeEditorLock,
  uploadBrandingAsset
} from '../actions/editor'
import {createSnapshot, loadFeedVersionForEditing} from '../actions/snapshots'
import {updateUserMetadata} from '../../manager/actions/user'
import {findProjectByFeedSource} from '../../manager/util'
import {setTutorialHidden} from '../../manager/actions/ui'
import {getControlPoints, getValidationErrors} from '../selectors'
import {getTableById, getIdsFromParams} from '../util/gtfs'
import type {dispatchFn, AppState} from '../../types/reducers'

const mapStateToProps = (state: AppState, ownProps: GtfsEditor & {location: any, routeParams: any}) => {
  const {
    feedSourceId,
    activeComponent,
    subComponent,
    subSubComponent,
    activeSubSubEntity
  } = ownProps.routeParams
  // Cast IDs to integers to match data type of fields returned by the SQL database
  const {activeEntityId, subEntityId} = getIdsFromParams(ownProps.routeParams)
  const {data, editSettings: editSettingsState, mapState} = state.editor
  const {present: editSettings} = editSettingsState
  const {active, tables, status} = data
  // FIXME: entityId is now a non-string line number and somewhere the number is
  // being cast to a string.
  const activeEntity = active.entity && active.entity.id === activeEntityId
    ? active.entity
    : active.entity && activeComponent === 'feedinfo'
      ? active.entity
      : null
  const activePattern = active.subEntity
  const entityEdited = active.edited
  const patternEdited = Boolean(active.patternEdited)
  const {controlPoints, patternSegments: patternCoordinates} = getControlPoints(state)
  // console.log(controlPoints, patternCoordinates)
  // controlPoints.forEach((cp, i) => {
  //   console.log(i, cp.stopId, cp.distance)
  // })
  const tableView = ownProps.location.query && ownProps.location.query.table === 'true'
  // Active set of entities (e.g., stops, routes, agency)
  const entities = activeComponent && getTableById(tables, activeComponent)
  // console.log(activeEntityId, activeEntity, active, active.entity)
  const validationErrors = getValidationErrors(state)
  const user = state.user

  // find the containing project
  const project = findProjectByFeedSource(state.projects.all, feedSourceId)
  const feedSource = project && project.feedSources && project.feedSources.find(fs => fs.id === feedSourceId)
  const namespace = feedSource && feedSource.editorNamespace

  const feedInfo = getTableById(tables, 'feedinfo')[0]
  const patternStop = active.patternStop || {}
  const {patternSegment} = active
  const timetableStatus = state.editor.timetable.status
  const feedIsLocked = !state.editor.data.lock.sessionId
  return {
    timetableStatus,
    tableData: tables,
    hideTutorial: state.ui.hideTutorial,
    feedSource,
    entities,
    feedSourceId,
    namespace,
    feedInfo,
    entityEdited,
    tableView,
    project,
    feedIsLocked,
    user,
    activeComponent,
    patternEdited,
    subSubComponent,
    subComponent,
    activeEntity,
    activeEntityId,
    subEntityId,
    activePattern,
    activeSubSubEntity,
    patternStop,
    patternSegment,
    editSettings,
    mapState,
    controlPoints,
    patternCoordinates,
    status,
    validationErrors,
    sidebarExpanded: state.ui.sidebarExpanded
  }
}

const mapDispatchToProps = (dispatch: dispatchFn, ownProps: GtfsEditor & {location: any, routeParams: any}): any => {
  const {
    feedSourceId,
    activeComponent,
    subComponent,
    subSubComponent,
    activeSubSubEntity
  } = ownProps.routeParams
  // Parse IDs from route params
  const {activeEntityId, subEntityId} = getIdsFromParams(ownProps.routeParams)
  const props = {
    component: activeComponent,
    newId: activeEntityId,
    activeEntityId,
    feedSourceId,
    subComponent,
    subEntityId,
    subSubComponent,
    activeSubSubEntity
  }
  return {
    updateUserMetadata: (profile, props) => dispatch(updateUserMetadata(profile, props)),
    onComponentMount: (initialProps, forceFetch) => {
      const {feedSource} = initialProps
      // Get all base GTFS tables
      if (!feedSource || feedSourceId !== feedSource.id) {
        // Get project and feed source if these are missing
        dispatch(fetchFeedSourceAndProject(feedSourceId))
          // Attempt to check out feed source for editing (i.e., lock the feed
          // source to prevent concurrent editing).
          .then(fs => dispatch(fetchBaseGtfs({namespace: fs.editorNamespace, ...props})))
          .then(() => dispatch(setActiveGtfsEntity(
            feedSourceId,
            activeComponent,
            activeEntityId,
            subComponent,
            subEntityId,
            subSubComponent,
            activeSubSubEntity,
            forceFetch
          )))
      } else {
        dispatch(fetchBaseGtfs({namespace: feedSource.editorNamespace, ...props}))
          .then(() => dispatch(setActiveGtfsEntity(
            feedSourceId,
            activeComponent,
            activeEntityId,
            subComponent,
            subEntityId,
            subSubComponent,
            activeSubSubEntity,
            forceFetch
          )))
      }
    },
    onComponentUpdate: (prevProps, newProps) => {
      // Detect push changes to URL (e.g., back button or direct link) and update
      // active table/entity accordingly.
      if (prevProps.activeComponent !== newProps.activeComponent ||
        prevProps.activeEntityId !== newProps.activeEntityId ||
        prevProps.subComponent !== newProps.subComponent ||
        prevProps.subEntityId !== newProps.subEntityId ||
        prevProps.subSubComponent !== newProps.subSubComponent ||
        prevProps.activeSubSubEntity !== newProps.activeSubSubEntity
      ) {
        dispatch(setActiveGtfsEntity(feedSourceId, activeComponent, activeEntityId, subComponent, subEntityId, subSubComponent, activeSubSubEntity))
      }
    },

    // NEW GENERIC GTFS/EDITOR FUNCTIONS
    removeEditorLock: (feedSourceId) => dispatch(removeEditorLock(feedSourceId)),
    updateEditSetting: (payload) => dispatch(updateEditSetting(payload)),
    updateMapSetting: (props) => dispatch(updateMapSetting(props)),
    setActiveEntity: (feedSourceId, component, entity, subComponent, subEntity, subSubComponent, subSubEntity) => {
      const entityId = entity && entity.id
      const subEntityId = subEntity && subEntity.id
      // This should only ever be a calendar entity
      const subSubEntityId = subSubEntity && subSubEntity.service_id
      dispatch(setActiveGtfsEntity(feedSourceId, component, entityId, subComponent, subEntityId, subSubComponent, subSubEntityId))
    },
    updateActiveGtfsEntity: (payload) => dispatch(updateActiveGtfsEntity(payload)),
    resetActiveEntity: (entity, component) => dispatch(resetActiveGtfsEntity(entity, component)),
    deleteEntity: (feedSourceId, component, entityId, routeId) => dispatch(deleteGtfsEntity(feedSourceId, component, entityId, routeId)),
    saveActiveEntity: (component) => dispatch(saveActiveGtfsEntity(component)),
    cloneEntity: (feedSourceId, component, entityId, save) => dispatch(cloneGtfsEntity(feedSourceId, component, entityId, save)),
    newGtfsEntity: (feedSourceId, component, props, save) => dispatch(newGtfsEntity(feedSourceId, component, props, save)),
    newGtfsEntities: (feedSourceId, component, propsArray, save) => dispatch(newGtfsEntities(feedSourceId, component, propsArray, save)),

    // ENTITY-SPECIFIC FUNCTIONS
    uploadBrandingAsset: (feedSourceId, entityId, component, file) => dispatch(uploadBrandingAsset(feedSourceId, entityId, component, file)),

    clearGtfsContent: () => dispatch(clearGtfsContent()),
    fetchTripPatterns: (feedSourceId) => dispatch(fetchTripPatterns(feedSourceId)),
    fetchTripsForCalendar: (feedSourceId, pattern, calendarId) => dispatch(fetchTripsForCalendar(feedSourceId, pattern, calendarId)),

    // TRIP PATTERN EDIT FUNCTIONS
    undoActiveTripPatternEdits: () => dispatch(undoActiveTripPatternEdits()),
    setActivePatternSegment: payload => dispatch(setActivePatternSegment(payload)),
    removeStopFromPattern: (pattern, stop, index) => dispatch(removeStopFromPattern(pattern, stop, index)),
    addStopToPattern: (pattern, stop, index) => dispatch(addStopToPattern(pattern, stop, index)),
    addStopAtPoint: (latlng, addToPattern, index, activePattern) => dispatch(addStopAtPoint(latlng, addToPattern, index, activePattern)),
    addStopAtInterval: (latlng, activePattern, controlPoints) => dispatch(addStopAtInterval(latlng, activePattern, controlPoints)),
    addStopAtIntersection: (latlng, activePattern, controlPoints) => dispatch(addStopAtIntersection(latlng, activePattern, controlPoints)),
    setActiveStop: ({id, index}) => dispatch(setActiveStop({id, index})),
    removeControlPoint: (controlPoints, index, pattern, patternCoordinates) => dispatch(removeControlPoint(controlPoints, index, pattern, patternCoordinates)),
    updatePatternStops: (pattern, patternStops) => dispatch(updatePatternStops(pattern, patternStops)),
    constructControlPoint: (props) => dispatch(constructControlPoint(props)),
    handleControlPointDragEnd: (controlPoints, index, latlng, pattern, patternCoordinates) => dispatch(handleControlPointDragEnd(controlPoints, index, latlng, pattern, patternCoordinates)),
    handleControlPointDragStart: (controlPoint) => dispatch(handleControlPointDragStart(controlPoint)),
    handleControlPointDrag: (controlPoints, index, latlng, pattern, patternCoordinates) => dispatch(handleControlPointDrag(controlPoints, index, latlng, pattern, patternCoordinates)),

    // SNAPHOTS
    createSnapshot: (feedSource, name, comment) => dispatch(createSnapshot(feedSource, name, comment)),
    loadFeedVersionForEditing: (payload) => dispatch(loadFeedVersionForEditing(payload)),

    // EDITOR UI
    setTutorialHidden: (value) => dispatch(setTutorialHidden(value))
  }
}

const ActiveGtfsEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsEditor)

export default ActiveGtfsEditor
