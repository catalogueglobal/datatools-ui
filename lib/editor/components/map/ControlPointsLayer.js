// @flow

import React, {Component} from 'react'
import {divIcon} from 'leaflet'

import {updateActiveGtfsEntity} from '../../actions/active'
import {isValidPoint} from '../../util/map'
import type {ControlPoint, Coordinates, GtfsStop, LatLng, Pattern} from '../../../types'
import type {EditSettingsState} from '../../../types/reducers'

import ControlPointMarker from './ControlPoint'

type Props = {
  activePattern: Pattern,
  controlPoints: Array<ControlPoint>,
  editSettings: EditSettingsState,
  handleControlPointDrag: (Array<ControlPoint>, number, LatLng, Pattern, Array<Coordinates>) => void,
  handleControlPointDragEnd: (Array<ControlPoint>, number, LatLng, Pattern, Array<Coordinates>) => void,
  handleControlPointDragStart: ControlPoint => void,
  patternCoordinates: Array<Coordinates>,
  patternSegment: number,
  removeControlPoint: (Array<ControlPoint>, number, Pattern, Array<Coordinates>) => void,
  setActivePatternSegment: number => void,
  stops: Array<GtfsStop>,
  updateActiveGtfsEntity: typeof updateActiveGtfsEntity
}

export default class ControlPointsLayer extends Component<Props> {
  render () {
    const {
      stops,
      activePattern,
      controlPoints,
      editSettings,
      patternCoordinates,
      patternSegment,
      setActivePatternSegment
    } = this.props
    const isEditing = stops && activePattern && patternCoordinates && editSettings.editGeometry && controlPoints
    return (
      <div ref='controlPoints'>
        {isEditing
          ? controlPoints.map((cp, index) => {
            // don't include controlPoint on end of segment (for now) or hidden controlPoints
            if (cp.stopId && editSettings.hideStopHandles) {
              return null
            }
            if (editSettings.hideInactiveSegments && (index > patternSegment + 1 || index < patternSegment - 1)) {
              // Do not render inactive control points if hide is enabled and
              // not adjacent to segment
              return null
            }
            const {point} = cp
            const isActive = index === patternSegment
            const color = isActive
              ? '#000'
              : index === patternSegment - 1 // control point before
                ? 'blue'
                : index === patternSegment + 1 // control point after
                  ? 'yellow'
                  : '#888' // inactive
            const iconType = cp.stopId ? 'fa-square' : 'fa-times'
            if (!isValidPoint(point)) {
              return null
            }
            const {coordinates} = point.geometry
            const key = cp.stopId
              ? `${cp.id}-${cp.stopId}-${activePattern.id}`
              : `${cp.id}-${activePattern.id}`
            const icon: HTMLElement = divIcon({
              className: '',
              html: `<i class="fa ${iconType}" style="color: ${color}"/>`
            })
            return (
              <ControlPointMarker
                position={[coordinates[1], coordinates[0]]}
                icon={icon}
                controlPoint={cp}
                key={key}
                stopId={cp.stopId}
                index={index}
                isActive={isActive}
                patternSegment={patternSegment}
                setActivePatternSegment={setActivePatternSegment}
                {...this.props} />
            )
          })
          : null
        }
      </div>
    )
  }
}
