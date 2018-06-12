import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Button, ButtonGroup} from 'react-bootstrap'
import ll from '@conveyal/lonlat'
import numeral from 'numeral'

import EditSettings from './EditSettings'
import {polyline as getPolyline} from '../../../scenario-editor/utils/valhalla'
import {
  controlPointsFromSegments,
  generateControlPointsFromPatternStops,
  getPatternDistance
} from '../../util/map'
import OptionButton from '../../../common/components/OptionButton'

export default class EditShapePanel extends Component {
  /**
   * Construct new pattern geometry from the pattern stop locations.
   */
  async drawPatternFromStops (pattern, stopsCoordinates, followStreets) {
    const {saveActiveEntity, setErrorMessage, updatePatternGeometry} = this.props
    let patternSegments = []
    if (followStreets) {
      patternSegments = await getPolyline(stopsCoordinates, true)
    } else {
      // Construct straight-line segments using stop coordinates
      stopsCoordinates
        .forEach((stop, i) => {
          if (i < stopsCoordinates.length - 1) {
            const segment = [ll.toCoordinates(stop), ll.toCoordinates(stopsCoordinates[i + 1])]
            patternSegments.push(segment)
          }
        })
    }
    if (patternSegments && patternSegments.length) {
      const controlPoints = controlPointsFromSegments(pattern.patternStops, patternSegments)
      updatePatternGeometry({
        controlPoints,
        patternSegments
      })
      saveActiveEntity('trippattern')
      return true
    } else {
      setErrorMessage({message: 'Error drawing pattern from stops! Some stops may be unreachable by streets.'})
      return false
    }
  }

  _cancelEdits = () => {
    const {activePattern, resetActiveEntity, togglePatternEditing} = this.props
    togglePatternEditing(false)
    resetActiveEntity(activePattern, 'trippattern')
  }

  createFromStops = () => {
    const {activePattern, editSettings, showConfirmModal, stops} = this.props
    showConfirmModal({
      title: `Create pattern shape from stops?`,
      body: `Are you sure you want to overwrite this trip pattern?`,
      onConfirm: () => {
        const stopLocations = stops && activePattern.patternStops && activePattern.patternStops.length
          ? activePattern.patternStops.map((s, index) => {
            const stop = stops.find(st => st.stop_id === s.stopId)
            return {lng: stop.stop_lon, lat: stop.stop_lat}
          })
          : []
        return this.drawPatternFromStops(activePattern, stopLocations, editSettings.present.followStreets)
      }
    })
  }

  _deleteShape = () => {
    const {
      activePattern,
      saveActiveEntity,
      showConfirmModal,
      stops,
      updateActiveEntity,
      updatePatternGeometry,
      updatePatternStops
    } = this.props
    const {patternStops} = activePattern
    showConfirmModal({
      title: `Delete shape for trip pattern?`,
      body: `Are you sure you want to delete this trip pattern shape?`,
      onConfirm: () => {
        // Update pattern geometry
        const result = generateControlPointsFromPatternStops(patternStops, stops)
        updatePatternGeometry(result)
        // Wipe pattern stops shape distance traveled values.
        const updatedPatternStops = patternStops.map(ps => ({
          ...ps,
          shapeDistTraveled: null
        }))
        updatePatternStops(activePattern, updatedPatternStops)
        updateActiveEntity(activePattern, 'trippattern', {shapePoints: []})
        saveActiveEntity('trippattern')
      }
    })
  }

  _beginEditing = () => {
    const {togglePatternEditing} = this.props
    togglePatternEditing(true)
  }

  save = () => {
    const {
      activePattern,
      editSettings,
      saveActiveEntity,
      updateEditSetting
    } = this.props
    const {editGeometry} = editSettings.present
    saveActiveEntity('trippattern')
      .then(() => updateEditSetting('editGeometry', !editGeometry, activePattern))
  }

  render () {
    const {
      activePattern,
      controlPoints, // FIXME use to describe which segment user is editing
      patternSegment,
      // patternSegments,
      editSettings: editSettingsState,
      resnapStops,
      setActivePatternSegment,
      updateEditSetting,
      undoActiveTripPatternEdits
    } = this.props
    const {present: editSettings} = editSettingsState
    const hasEdits = editSettingsState.past.length === 0
    const hasShapePoints = activePattern.shapePoints && activePattern.shapePoints.length > 0
    let buttons
    if (editSettings.editGeometry) {
      buttons = [{
        key: 'save',
        // Save is disabled if there have not been any edits made to shape points
        disabled: hasEdits,
        onClick: this.save,
        children: <span><Icon type='check' /> Save</span>
      }, {
        key: 'undo',
        disabled: hasEdits,
        onClick: undoActiveTripPatternEdits,
        children: <span><Icon type='undo' /> Undo</span>
      }, {
        key: 'delete',
        onClick: this._deleteShape,
        children: <span><Icon type='trash' /> Wipe</span>,
        disabled: !hasShapePoints
      }, {
        key: 'create',
        onClick: this.createFromStops,
        children: <span><Icon type='map-marker' /> Stops</span>
      }]
    }

    const dist = getPatternDistance(activePattern, controlPoints)
    const formattedShapeDistance = numeral(dist).format('0,0.00')

    return (
      <div>
        <h4 className='line'>
          Pattern shape
          {' '}
          ({formattedShapeDistance} miles)
        </h4>
        {editSettings.editGeometry
          ? <div>
            <Button
              block
              style={{marginTop: '5px', marginBottom: '5px'}}
              onClick={this._cancelEdits}
              bsSize='small'>
              <span><Icon type='times' /> Cancel geometry edits</span>
            </Button>
            <div>
              <OptionButton
                onClick={setActivePatternSegment}
                value={patternSegment - 1}
                disabled={!patternSegment || patternSegment < 1}
                bsSize='xsmall'>
                <Icon type='square' style={{color: 'blue'}} /> Prev.
              </OptionButton>
              <small>
                {!patternSegment && patternSegment !== 0
                  ? `Click segment to begin editing`
                  : `Manipulating anchor ${patternSegment + 1} of ${controlPoints.length}`
                }
              </small>
              <OptionButton
                onClick={setActivePatternSegment}
                value={(!patternSegment && patternSegment !== 0)
                  ? 0
                  : patternSegment + 1
                }
                disabled={patternSegment >= controlPoints.length - 1}
                bsSize='xsmall'>
                <Icon type='square' style={{color: 'yellow'}} /> Next
              </OptionButton>
            </div>
            <ButtonGroup justified>
              {buttons.map(b => (
                <Button href='#' bsSize='small' {...b} />
              ))}
            </ButtonGroup>
            <EditSettings
              editSettings={editSettings}
              resnapStops={resnapStops}
              updateEditSetting={updateEditSetting} />
          </div>
          : <Button
            block
            onClick={this._beginEditing}
            bsSize='small'
            bsStyle='warning'>
            <span><Icon type='pencil' /> Edit pattern geometry</span>
          </Button>
        }
      </div>
    )
  }
}
