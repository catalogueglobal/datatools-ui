// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Form } from 'react-bootstrap'

import {updateActiveGtfsEntity} from '../actions/active'
import ActiveTripPatternList from '../containers/ActiveTripPatternList'
import { getZones, getEditorTable, canApproveGtfs } from '../util'
import { getTableById } from '../util/gtfs'
import type {EditorTableData, Entity, Feed, Field, Pattern, Project} from '../../types'
import type {ManagerUserState, MapState} from '../../types/reducers'
import type {EditorValidationIssue} from '../util/validation'

import ScheduleExceptionForm from './ScheduleExceptionForm'
import EntityDetailsHeader from './EntityDetailsHeader'
import FareRulesForm from './FareRulesForm'
import EditorInput from './EditorInput'

type Props = {
  activeComponent: string,
  activeEntity: Entity,
  activeEntityId: number,
  activePattern: Pattern,
  deleteEntity: (string, string, string, string) => void,
  entities: Array<Entity>,
  entityEdited: boolean,
  feedSource: Feed,
  hasRoutes: boolean,
  mapState: MapState,
  newGtfsEntity: (string, string) => void,
  offset: number,
  project: Project,
  resetActiveEntity: (Entity, string) => void,
  saveActiveEntity: string => void,
  setActiveEntity: (string, string, Entity, ?string) => void,
  showConfirmModal: any,
  subComponent: string,
  subEntity: number,
  tableData: EditorTableData,
  updateActiveGtfsEntity: typeof updateActiveGtfsEntity,
  updateMapSetting: ({bounds?: any, target?: number, zoom?: number}) => void,
  uploadBrandingAsset: (string, number, string, File) => void,
  user: ManagerUserState,
  validationErrors: Array<EditorValidationIssue>,
  width: number
}

type State = {
  editFareRules: boolean
}

export default class EntityDetails extends Component<Props, State> {
  state = {
    editFareRules: false
  }

  _hasValidationIssue = (field: Field) =>
    this.props.validationErrors.find(e => e.field === field.name)

  _toggleFareRules = (editFareRules: boolean) => this.setState({editFareRules})

  render () {
    const {
      activeComponent,
      project,
      feedSource,
      user,
      activeEntity,
      width,
      offset,
      tableData,
      subComponent,
      showConfirmModal,
      validationErrors
    } = this.props
    // $FlowFixMe
    const approveGtfsDisabled = !canApproveGtfs(project, feedSource, user)
    const panelStyle = {
      width: `${width}px`,
      height: '100%',
      position: 'absolute',
      overflowX: 'visible',
      top: '0px',
      left: offset || '0px',
      zIndex: 2,
      backgroundColor: '#F2F2F2',
      paddingRight: '5px',
      paddingLeft: '5px',
      borderRight: '1px solid #ddd'
    }
    if (!activeEntity) {
      return (
        <div style={panelStyle}>
          <div className='entity-details-loading' style={{height: '100%'}}>
            <h1
              className='text-center'
              style={{marginTop: '150px'}}>
              <Icon className='fa-5x fa-spin' type='refresh' />
            </h1>
          </div>
        </div>
      )
    }
    // $FlowFixMe
    const {zones, zoneOptions} = getZones(getTableById(tableData, 'stop'), activeEntity)
    const currentTable = getEditorTable(activeComponent)
    // Render the default form if not viewing trip patterns, schedule exceptions,
    // or fare rules.
    const renderDefault = subComponent !== 'trippattern' &&
      !this.state.editFareRules &&
      activeComponent !== 'scheduleexception'
    return (
      <div style={panelStyle}>
        <div className='entity-details'>
          {/* // $FlowFixMe */}
          <EntityDetailsHeader
            validationErrors={validationErrors}
            editFareRules={this.state.editFareRules}
            toggleEditFareRules={this._toggleFareRules}
            {...this.props} />
          {/* Entity Details Body */}
          <div className='entity-details-body'>
            {/* Render relevant form based on entity type */}
            {subComponent === 'trippattern'
              ? <ActiveTripPatternList
                showConfirmModal={showConfirmModal} />
              : this.state.editFareRules && activeEntity
                // $FlowFixMe
                ? <FareRulesForm
                  zones={zones}
                  zoneOptions={zoneOptions}
                  {...this.props} />
                : activeComponent === 'scheduleexception'
                  // $FlowFixMe
                  ? <ScheduleExceptionForm {...this.props} />
                  : <div>
                    <Form>
                      {/* Editor Inputs // $FlowFixMe */}
                      {renderDefault && currentTable.fields
                        .map((field, i) => (
                          <div
                            key={`${activeComponent}-${activeEntity.id || ''}-${i}`}
                            data-test-id={`${activeComponent}-${field.name}-input-container`}>
                            {/* // $FlowFixMe */}
                            <EditorInput
                              field={field}
                              currentValue={activeEntity[field.name]}
                              approveGtfsDisabled={approveGtfsDisabled}
                              zoneOptions={zoneOptions}
                              isNotValid={this._hasValidationIssue(field)}
                              {...this.props} />
                          </div>
                        ))
                      }
                    </Form>
                  </div>
            }
          </div>
        </div>
      </div>
    )
  }
}
