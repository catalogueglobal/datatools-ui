// @flow

import React, {Component} from 'react'

import {updateActiveGtfsEntity, updateEditSetting} from '../actions/active'
import CurrentStatusMessage from '../../common/containers/CurrentStatusMessage'
import ConfirmModal from '../../common/components/ConfirmModal'
import Title from '../../common/components/Title'
import CurrentStatusModal from '../../common/containers/CurrentStatusModal'
import ActiveEntityList from '../containers/ActiveEntityList'
import ActiveTimetableEditor from '../containers/ActiveTimetableEditor'
import ActiveFeedInfoPanel from '../containers/ActiveFeedInfoPanel'
import {getConfigProperty} from '../../common/util/config'
import {getEntityName, getTableById} from '../util/gtfs'
import {GTFS_ICONS} from '../util/ui'
import type {
  ControlPoint,
  Coordinates,
  EditorTableData,
  Entity,
  Feed,
  FeedInfo,
  FetchStatus,
  GtfsStop,
  LatLng,
  Pattern,
  PatternStop,
  Project
} from '../../types'
import type {
  EditSettingsState,
  EditorStatus,
  ManagerUserState,
  MapState
} from '../../types/reducers'
import type {EditorValidationIssue} from '../util/validation'

import EntityDetails from './EntityDetails'
import EditorSidebar from './EditorSidebar'
import EditorHelpModal from './EditorHelpModal'
import EditorMap from './map/EditorMap'

type Props = {
  activeComponent: string,
  activeEntity: Entity,
  activeEntityId: number,
  activePattern: Pattern,
  activeSubSubEntity: string,
  addStopAtIntersection: (LatLng, Pattern) => void,
  addStopAtInterval: (LatLng, Pattern, Array<ControlPoint>) => void,
  addStopAtPoint: (LatLng, boolean, any, Pattern) => void,
  addStopToPattern: (Pattern, GtfsStop) => void,
  clearGtfsContent: () => void,
  cloneEntity: () => void,
  cloneEntity: () => void,
  constructControlPoint: () => void,
  controlPoints: Array<ControlPoint>,
  createSnapshot: () => void,
  currentPattern: Pattern,
  currentTable: string,
  deleteEntity: () => void,
  deleteTripsForCalendar: () => void,
  editSettings: EditSettingsState,
  entities: Array<Entity>,
  entities: Array<Entity>,
  entityEdited: boolean,
  feedInfo: FeedInfo,
  feedInfo: FeedInfo,
  feedIsLocked: boolean,
  feedSource: Feed,
  feedSource: Feed,
  feedSourceId: string,
  fetchTripPatterns: () => void,
  fetchTripPatternsForRoute: () => void,
  fetchTripsForCalendar: () => void,
  handleControlPointDrag: () => void,
  handleControlPointDragEnd: () => void,
  handleControlPointDragStart: () => void,
  hasRoutes: boolean,
  hideTutorial: boolean,
  hideTutorial: boolean,
  loadFeedVersionForEditing: () => void,
  mapState: MapState,
  mapState: MapState,
  namespace: string,
  newGtfsEntity: (string, string, ?any, ?boolean) => void,
  offset: number,
  onComponentMount: (Props, ?boolean) => void,
  onComponentUpdate: (Props, Props) => void,
  patternCoordinates: Array<Coordinates>,
  patternEdited: boolean,
  patternSegment: number,
  patternStop: {id: string, index: number},
  project: Project,
  removeControlPoint: () => void,
  removeEditorLock: (string, ?boolean) => void,
  removeStopFromPattern: (Pattern, GtfsStop, number) => void,
  resetActiveEntity: () => void,
  routeParams: any,
  saveActiveEntity: () => void,
  saveTripsForCalendar: () => void,
  setActiveEntity: () => void,
  setActivePatternSegment: () => void,
  setActiveStop: ({id: ?any, index: ?number}) => void,
  setTutorialHidden: () => void,
  showConfirmModal: ({body: string, onConfirm: () => void, title: string}) => void,
  sidebarExpanded: boolean,
  status: EditorStatus,
  subComponent: string,
  subEntity: number,
  subEntityId: number,
  subSubComponent: string,
  tableData: EditorTableData,
  timetableStatus: FetchStatus, // fetchStatus
  tripPatterns: Array<Pattern>,
  updateActiveGtfsEntity: typeof updateActiveGtfsEntity,
  updateCellValue: ({key: string, rowIndex: number, value: string | number}) => void,
  updateEditSetting: typeof updateEditSetting,
  updateMapSetting: ({bounds?: any, target?: number, zoom?: number}) => void,
  updatePatternStops: (Pattern, Array<PatternStop>) => void,
  updateUserMetadata: (any, any) => void,
  uploadBrandingAsset: (string, number, string, File) => void,
  user: ManagerUserState,
  validationErrors: Array<EditorValidationIssue>,
  zoomToTarget: ?number
}

type State = {
  activeTableId: ?string
}

export default class GtfsEditor extends Component<Props, State> {
  state = {
    activeTableId: this.props.currentTable
  }

  componentWillMount () {
    // Wipe any leftover state that may exist for other feed sources in editor.
    // NOTE: Clear GTFS content happens outside of onComponentMount function so
    // that it is only ever called on mount (onComponentMount is called after
    // a successful snapshot/import when starting from scratch).
    this.props.clearGtfsContent()
    this.props.onComponentMount(this.props)
  }

  componentCleanUp = () => {
    // When the user exits the editor, remove the lock on the editor feed resource.
    this.props.removeEditorLock(this.props.feedSourceId)
  }

  componentDidMount () {
    // If the browser window/tab is closed, the componnent does not have a chance
    // to run componentWillUnmount. This event listener runs clean up in those
    // cases.
    const unloadEvent = window.attachEvent ? 'onbeforeunload' : 'beforeunload'
    window.addEventListener(unloadEvent, this.componentCleanUp)
  }

  componentWillUnmount () {
    // Run component clean-up
    // console.log('componnent is unmounting')
    this.componentCleanUp()
    // And remove the event handler for normal unmounting
    const unloadEvent = window.attachEvent ? 'onbeforeunload' : 'beforeunload'
    window.removeEventListener(unloadEvent, this.componentCleanUp)
  }

  componentDidUpdate (prevProps: Props) {
    // handles back button
    this.props.onComponentUpdate(prevProps, this.props)
  }

  // FIXME: needs to be updated for GraphQL
  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.feedSourceId !== this.props.feedSourceId) {
      // Clear GTFS content if feedSource changes (i.e., user switches feed sources).
      // Remove editor lock.
      this.props.removeEditorLock(this.props.feedSourceId, false)
      this.props.clearGtfsContent()
      // Re-establish lock for new feed source and fetch GTFS.
      this.props.onComponentMount(nextProps)
    }
    if (this.props.namespace && nextProps.namespace !== this.props.namespace) {
      // If the editor namespace changes (not simply from null), re-fetch the GTFS.
      // There should be no need to re-lock the feed because feeds are locked by
      // feed source because there is only ever one editable namespace per feed
      // source. If this changes (i.e., more than one namespace per feed is
      // simultaneously editable), this behavior needs to be altered.
      // NOTE: The namespace could change like this if a user restores a snapshot
      // while they have the editor open.
      const forceFetch = true
      this.props.onComponentMount(nextProps, forceFetch)
    }
  }

  showConfirmModal = (props: {body: string, onConfirm: () => void, title: string}) => {
    this.refs.confirmModal.open(props)
  }

  getEditorTitle () {
    const {activeComponent, activeEntity} = this.props
    const appName = getConfigProperty('application.title')
    let title = ''
    if (appName) title += `${appName} - `
    title += 'GTFS Editor'
    if (activeEntity) {
      title += ` - ${getEntityName(activeEntity)}`
    } else if (activeComponent) {
      const icon = GTFS_ICONS.find(i => i.id === activeComponent)
      title += ` - ${icon ? icon.label : 'unknown'}`
    }
    return title
  }

  getMapOffset (activeComponent: string, dWidth: number, activeEntityId: number, lWidth: number) {
    return activeComponent === 'feedinfo'
      ? dWidth
      : activeEntityId
        ? lWidth + dWidth
        : activeComponent
          ? lWidth
          : 0
  }

  render () {
    const {
      feedSource,
      user,
      createSnapshot,
      loadFeedVersionForEditing,
      activeEntityId,
      tableData,
      entities,
      activeComponent,
      sidebarExpanded,
      feedInfo,
      feedIsLocked,
      setActiveEntity,
      subSubComponent,
      activeEntity,
      deleteEntity,
      updateActiveGtfsEntity,
      resetActiveEntity,
      saveActiveEntity,
      fetchTripsForCalendar,
      updateCellValue,
      cloneEntity,
      newGtfsEntity,
      mapState,
      hideTutorial,
      status,
      setTutorialHidden,
      project
    } = this.props
    let editingIsDisabled = true
    if (feedSource) {
      // FIXME: warn user if they don't have edit privileges
      const {id, name, projectId, organizationId} = feedSource
      editingIsDisabled = !user.permissions ||
        !user.permissions.hasFeedPermission(organizationId, projectId, id, 'edit-gtfs') ||
        feedIsLocked
      if (editingIsDisabled) {
        console.warn(`User does not have permission to edit GTFS for ${name}.`)
      }
    }
    const LIST_WIDTH = 220
    const stops: Array<GtfsStop> = getTableById(tableData, 'stop')
    const DETAILS_WIDTH = 300
    const entityDetails = activeEntityId
      ? <EntityDetails
        width={DETAILS_WIDTH}
        key='entity-details'
        offset={LIST_WIDTH}
        stops={stops}
        showConfirmModal={this.showConfirmModal}
        {...this.props} />
      : null
    return (
      <div className='GtfsEditor'>
        <Title>{this.getEditorTitle()}</Title>
        <EditorSidebar
          activeComponent={activeComponent}
          editingIsDisabled={editingIsDisabled}
          expanded={sidebarExpanded}
          feedSource={feedSource}
          setActiveEntity={setActiveEntity} />
        {status.showEditorModal
          ? <EditorHelpModal
            show
            isNewFeed
            feedSource={feedSource}
            hideTutorial={hideTutorial}
            status={status}
            loadFeedVersionForEditing={loadFeedVersionForEditing}
            onComponentMount={this.props.onComponentMount}
            createSnapshot={createSnapshot}
            setTutorialHidden={setTutorialHidden} />
          : null
        }
        <div style={{
          position: 'fixed',
          left: sidebarExpanded ? 130 : 50,
          bottom: 0,
          right: 0,
          minHeight: '500px',
          top: 0}}>
          {subSubComponent === 'timetable' // && activeEntity
            ? <ActiveTimetableEditor
              feedSource={feedSource}
              route={activeEntity}
              showConfirmModal={this.showConfirmModal}
              setActiveEntity={setActiveEntity}
              tableData={tableData}
              deleteEntity={deleteEntity}
              updateActiveGtfsEntity={updateActiveGtfsEntity}
              resetActiveEntity={resetActiveEntity}
              saveActiveEntity={saveActiveEntity}
              fetchTripsForCalendar={fetchTripsForCalendar}
              timetableStatus={this.props.timetableStatus}
              sidebarExpanded={sidebarExpanded}
              updateCellValue={updateCellValue} />
            : activeComponent === 'feedinfo'
              ? <EntityDetails
                width={DETAILS_WIDTH}
                {...this.props} />
              : activeComponent
                ? [
                  <ActiveEntityList
                    width={LIST_WIDTH}
                    setActiveEntity={setActiveEntity}
                    cloneEntity={cloneEntity}
                    updateActiveGtfsEntity={updateActiveGtfsEntity}
                    deleteEntity={deleteEntity}
                    newGtfsEntity={newGtfsEntity}
                    showConfirmModal={this.showConfirmModal}
                    // FIXME: remove entities because list of entities is determined
                    // in selector
                    entities={entities}
                    activeEntityId={activeEntityId}
                    activeComponent={activeComponent}
                    feedSource={feedSource}
                    key='entity-list' />,
                  entityDetails
                ]
                : null
          }
          <EditorMap
            offset={this.getMapOffset(activeComponent, DETAILS_WIDTH, activeEntityId, LIST_WIDTH)}
            hidden={subSubComponent === 'timetable'}
            stops={stops}
            showConfirmModal={this.showConfirmModal}
            drawStops={!!(mapState.zoom && mapState.zoom > 14)}
            zoomToTarget={mapState.target}
            sidebarExpanded={sidebarExpanded}
            {...this.props} />
          <ActiveFeedInfoPanel
            feedSource={feedSource}
            project={project}
            showConfirmModal={this.showConfirmModal}
            setActiveEntity={setActiveEntity}
            feedInfo={feedInfo} />
        </div>
        <CurrentStatusMessage />
        <ConfirmModal ref='confirmModal' />
        <CurrentStatusModal ref='statusModal' />
      </div>
    )
  }
}
