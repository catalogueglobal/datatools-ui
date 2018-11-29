// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Button } from 'react-bootstrap'

import {updateActiveGtfsEntity, updateEditSetting} from '../../actions/active'
import VirtualizedEntitySelect from '../VirtualizedEntitySelect'
import type {Pattern, GtfsStop, Entity, Feed, ControlPoint, Coordinates, PatternStop} from '../../../types'
import type {EditorStatus, EditSettingsUndoState, MapState} from '../../../types/reducers'

import PatternStopContainer from './PatternStopContainer'

type Props = {
  activePattern: Pattern,
  addStopToPattern: (Pattern, GtfsStop) => void,
  controlPoints: Array<ControlPoint>,
  editSettings: EditSettingsUndoState,
  feedSource: Feed,
  mapState: MapState,
  patternEdited: boolean,
  patternSegments: Array<Coordinates>,
  patternStop: {id: ?any, index: ?number},
  removeStopFromPattern: (Pattern, GtfsStop, number) => void,
  saveActiveEntity: string => Promise<any>,
  setActiveEntity: (string, string, Entity, string, ?Entity) => void,
  setActiveStop: ({id: ?any, index: ?number}) => void,
  status: EditorStatus,
  stops: Array<GtfsStop>,
  updateActiveGtfsEntity: typeof updateActiveGtfsEntity,
  updateEditSetting: typeof updateEditSetting,
  updatePatternGeometry: any => void,
  updatePatternStops: (Pattern, Array<PatternStop>) => void,
}

export default class PatternStopsPanel extends Component<Props> {
  _toggleAddStopsMode = () => {
    const {editSettings, updateEditSetting} = this.props
    updateEditSetting({
      setting: 'addStops',
      value: !editSettings.present.addStops
    })
  }

  _addStopFromSelect = (input: any) => {
    if (!input) {
      return
    }
    const stop: GtfsStop = input.entity
    return this.props.addStopToPattern(this.props.activePattern, stop)
  }

  render () {
    const {
      addStopToPattern,
      activePattern,
      editSettings,
      mapState,
      patternStop,
      feedSource,
      patternEdited,
      controlPoints,
      patternSegments,
      updatePatternGeometry,
      removeStopFromPattern,
      saveActiveEntity,
      setActiveEntity,
      setActiveStop,
      status,
      stops,
      updateActiveGtfsEntity,
      updatePatternStops
    } = this.props
    const {addStops} = editSettings.present
    const patternHasStops = activePattern.patternStops &&
      activePattern.patternStops.length > 0
    return (
      <div>
        <h4 className='line'>
          Stops
          {' '}
          ({activePattern.patternStops ? activePattern.patternStops.length : 0})
        </h4>
        <div style={{width: '100%'}}>
          <Button
            onClick={this._toggleAddStopsMode}
            className='pull-right'
            bsSize='small'>
            {addStops
              ? <span><Icon type='times' /> Cancel</span>
              : <span><Icon type='plus' /> Add stop</span>
            }
          </Button>
          <small className='pull-right' style={{margin: '5px'}}>
            {addStops && mapState.zoom && mapState.zoom <= 14
              ? 'Zoom to view stops'
              : `Add stops via map`
            }
          </small>
        </div>
        {/* List of pattern stops */}
        <div id='pattern-stop-list-header'>
          <div className='pull-left' style={{width: '50%'}}>
            <p className='small' style={{marginBottom: '0px'}}>
              <strong>Stop sequence</strong>
            </p>
          </div>
          <div className='pull-right' style={{width: '50%'}}>
            <p style={{marginBottom: '0px'}} className='small text-right'>
              <strong>Travel time</strong>
            </p>
          </div>
          <div className='clearfix' />
        </div>
        {patternHasStops
          ? <PatternStopContainer
            stops={stops}
            activePattern={activePattern}
            patternStop={patternStop}
            controlPoints={controlPoints}
            patternSegments={patternSegments}
            updatePatternStops={updatePatternStops}
            updatePatternGeometry={updatePatternGeometry}
            status={status}
            updateActiveGtfsEntity={updateActiveGtfsEntity}
            saveActiveEntity={saveActiveEntity}
            addStopToPattern={addStopToPattern}
            removeStopFromPattern={removeStopFromPattern}
            setActiveEntity={setActiveEntity}
            feedSource={feedSource}
            patternEdited={patternEdited}
            setActiveStop={setActiveStop} />
          : <p className='lead text-center'>This pattern has no stops.</p>
        }
        {/* Add stop selector */}
        {addStops
          ? <div className='pattern-stop-card'>
            <VirtualizedEntitySelect
              component={'stop'}
              entities={stops}
              onChange={this._addStopFromSelect} />
            <div style={{marginTop: '5px'}}>
              <Button
                bsSize='small'
                bsStyle='default'
                block
                onClick={this._toggleAddStopsMode}>
                <Icon type='times' /> Cancel
              </Button>
            </div>
          </div>
          : <Button
            block
            bsSize='small'
            data-test-id='add-stop-by-name-button'
            onClick={this._toggleAddStopsMode}
          >
            <Icon type='plus' /> Add stop by name
          </Button>
        }
      </div>
    )
  }
}
