import ll from '@conveyal/lonlat'
import uniqueId from 'lodash.uniqueid'
import shp from 'shpjs'
import lineDistance from 'turf-line-distance'
import lineSlice from 'turf-line-slice'
import point from 'turf-point'

import {updateActiveGtfsEntity, saveActiveGtfsEntity} from '../active'
import {setErrorMessage} from '../../../manager/actions/status'
import {polyline as getPolyline} from '../../../scenario-editor/utils/valhalla'
import {recalculateShape, newControlPoint} from '../../util/map'

export function addControlPoint (controlPoint, index) {
  return {
    type: 'ADD_CONTROL_POINT',
    controlPoint,
    index
  }
}

export function constructControlPoint (pattern, latlng, controlPoints) {
  return function (dispatch, getState) {
    // slice line
    const beginPoint = point(pattern.shape.coordinates[0])
    const coord = ll.toCoordinates(latlng)
    const clickPoint = point(coord)
    const lineSegment = lineSlice(beginPoint, clickPoint, pattern.shape)

    // measure line segment
    const distTraveled = lineDistance(lineSegment, 'meters')
    const controlPoint = newControlPoint(distTraveled, clickPoint)

    // find splice index based on shape dist traveled
    let index = 0
    for (var i = 0; i < controlPoints.length; i++) {
      if (distTraveled > controlPoints[i].distance) {
        index = i + 1
      } else {
        break
      }
    }
    // add control point
    dispatch(addControlPoint(controlPoint, index))
  }
}

function controlPointDragOrEnd (dragId) {
  return {
    type: 'CONTROL_POINT_DRAG_START_OR_END',
    dragId
  }
}

export function displayRoutesShapefile (feedSource, file) {
  return function (dispatch, getState) {
    const reader = new window.FileReader()
    reader.onload = e => {
      const arrayBuff = reader.result
      shp(arrayBuff).then(geojson => {
        console.log(geojson)
        geojson.key = Math.random()
        dispatch(receivedRoutesShapefile(feedSource, geojson))
      })
    }
    reader.readAsArrayBuffer(file)
  }
}

export function extendPatternToPoint (pattern, endPoint, newEndPoint) {
  return async function (dispatch, getState) {
    const {followStreets} = getState().editor.editSettings
    let newShape
    if (followStreets) {
      newShape = await getPolyline([endPoint, newEndPoint])
    }
    // get single coordinate for straight line if polyline fails or if not following streets
    if (!newShape) {
      newShape = [ll.toCoordinates(newEndPoint)]
    }
    // append newShape coords to existing pattern coords
    const shape = {type: 'LineString', coordinates: [...pattern.shape.coordinates, ...newShape]}
    dispatch(updateActiveGtfsEntity(pattern, 'trippattern', {shape}))
    await dispatch(saveActiveGtfsEntity('trippattern'))
    return shape
  }
}

/**
 * Calculate a new shape according to newly dragged position of control point
 *
 * @param  {ControlPoint[]} controlPoints
 * @param  {Number} index Index of the control point being dragged
 * @param  {Position} latlng  Position of drag point
 * @param  {Object} patternShape
 */
export function handleControlPointDrag (
  controlPoints,
  index,
  latlng,
  patternShape
) {
  return function (dispatch, getState) {
    const {currentDragId, followStreets} = getState().editor.editSettings
    recalculateShape({
      controlPoints,
      defaultToStraightLine: false,
      dragId: currentDragId,
      editType: 'update',
      followStreets,
      index,
      newPoint: latlng,
      patternShape
    }).then(result => {
      // make sure dragging hasn't already stopped and that coordinates are returned
      if (
        result.dragId === getState().editor.editSettings.currentDragId &&
        result.coordinates
      ) {
        dispatch(updatePatternCoordinates(result.coordinates))
      }
    })
  }
}

export function handleControlPointDragEnd (controlPoints, index, latlng, pattern) {
  return function (dispatch, getState) {
    // proclaim end of dragging
    dispatch(controlPointDragOrEnd())

    // recalculate shape for final position
    const {followStreets} = getState().editor.editSettings
    recalculateShape({
      controlPoints,
      defaultToStraightLine: false,
      editType: 'update',
      index,
      followStreets,
      newPoint: latlng,
      patternShape: pattern.shape,
      snapControlPointToNewSegment: true
    }).then(result => {
      if (!result.coordinates) {
        dispatch(setErrorMessage(
          'An error occurred while trying to recalculate the shape after dragging.  Please try again.'
        ))
      } else {
        dispatch(
          updateActiveGtfsEntity(pattern, 'trippattern', {
            shape: {type: 'LineString', coordinates: result.coordinates}
          })
        )
        dispatch(updateControlPoints(result.updatedControlPoints))
      }
    })
  }
}

/**
 * Save data to store that dragging is in progress
 *
 * @param  {ControlPoint} controlPoint
 * @return {Action}
 */
export function handleControlPointDragStart (controlPoint) {
  return controlPointDragOrEnd(uniqueId(controlPoint.id))
}

function receivedRoutesShapefile (feedSource, geojson) {
  return {
    type: 'RECEIVED_ROUTES_SHAPEFILE',
    feedSource,
    geojson
  }
}

export function removeControlPoint (controlPoints, index, pattern) {
  return async function (dispatch, getState) {
    const {followStreets} = getState().editor.editSettings
    const {
      coordinates,
      updatedControlPoints
    } = await recalculateShape({
      controlPoints,
      editType: 'delete',
      index,
      followStreets,
      patternShape: pattern.shape
    })

    // update pattern
    dispatch(
      updateActiveGtfsEntity(pattern, 'trippattern', {
        shape: {type: 'LineString', coordinates}
      })
    )
    // update controlPoints
    dispatch(updateControlPoints(updatedControlPoints))
  }
}

export function updateControlPoints (newControlPoints) {
  return {
    type: 'UPDATE_CONTROL_POINTS',
    newControlPoints
  }
}

export function updateMapSetting (props) {
  return {
    type: 'UPDATE_MAP_SETTING',
    props
  }
}

export function updatePatternCoordinates (coordinates) {
  return {
    type: 'UPDATE_PATTERN_COORDINATES',
    coordinates
  }
}
