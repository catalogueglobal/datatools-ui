// @flow

import React, {Component} from 'react'

import EditableTextField from '../../../common/components/EditableTextField'

import EditShapePanel from './EditShapePanel'
import EditSchedulePanel from './EditSchedulePanel'
import CalculateDefaultTimesForm from './CalculateDefaultTimesForm'
import PatternStopsPanel from './PatternStopsPanel'
import type {Props} from './TripPatternList'

export default class TripPatternViewer extends Component<Props> {
  savePatternName = (name: string) => {
    const {activePattern, saveActiveEntity, updateActiveGtfsEntity} = this.props
    updateActiveGtfsEntity({
      component: 'trippattern',
      entity: activePattern,
      props: {name}
    })
    saveActiveEntity('trippattern')
  }

  render () {
    const {
      activeEntity,
      activePattern,
      activePatternId,
      activePatternTripCount,
      deleteAllTripsForPattern,
      feedSource,
      saveActiveEntity,
      setActiveEntity,
      showConfirmModal,
      updateActiveGtfsEntity
    } = this.props
    if (!activePattern) return null
    return (
      <div>
        <EditableTextField
          value={activePattern.name}
          maxLength={28}
          onChange={this.savePatternName} />
        <EditShapePanel {...this.props} />
        <EditSchedulePanel
          activeEntity={activeEntity}
          activePattern={activePattern}
          activePatternId={activePatternId}
          activePatternTripCount={activePatternTripCount}
          deleteAllTripsForPattern={deleteAllTripsForPattern}
          feedSource={feedSource}
          saveActiveEntity={saveActiveEntity}
          setActiveEntity={setActiveEntity}
          showConfirmModal={showConfirmModal}
          updateActiveGtfsEntity={updateActiveGtfsEntity} />
        <PatternStopsPanel {...this.props} />
        <CalculateDefaultTimesForm {...this.props} />
      </div>
    )
  }
}
