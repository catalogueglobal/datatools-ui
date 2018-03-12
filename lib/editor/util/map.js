// @flow

import ll from '@conveyal/lonlat'
import clone from 'lodash.clonedeep'
import fetch from 'isomorphic-fetch'
import lineDistance from 'turf-line-distance'
import lineSlice from 'turf-line-slice'
import lineSliceAlong from '@turf/line-slice-along'
import lineString from 'turf-linestring'
import point from 'turf-point'
import pointOnLine from 'turf-point-on-line'

import {getSegment} from '../../scenario-editor/utils/valhalla'
import {generateUID} from '../../common/util/util'
import {getConfigProperty} from '../../common/util/config'
import {reverseEsri as reverse} from '../../scenario-editor/utils/reverse'

import type {
  ControlPoint,
  Coordinate,
  Coordinates,
  Feed,
  GeoJsonLinestring,
  GeoJsonPoint,
  GtfsStop,
  LatLng,
  Pattern,
  StopTime
} from '../../types'

type MapLayer = {
  id: string,
  name: string
}

export const MAP_LAYERS: Array<MapLayer> = [
  {
    name: 'Streets',
    id: 'mapbox.streets'
  },
  {
    name: 'Light',
    id: 'mapbox.light'
  },
  {
    name: 'Dark',
    id: 'mapbox.dark'
  },
  {
    name: 'Satellite',
    id: 'mapbox.streets-satellite'
  }
]

export function clickToLatLng (
  latlng: LatLng
): {stop_lat: number, stop_lon: number} {
  const precision = 100000000 // eight decimal places is accurate up to 1.1 meters
  return {
    stop_lat: Math.round(latlng.lat * precision) / precision,
    stop_lon: Math.round(latlng.lng % 180 * precision) / precision
  }
}

/**
 * Deep clone a control point and set the distance based on an offset.
 * @param {ControlPoint} controlPoint
 * @param {Number} offset The distance to offset the original control point
 * @return {ControlPoint}
 */
function cloneControlPointWithDistanceOffset (
  controlPoint: ControlPoint,
  offset: number
): ControlPoint {
  const clonedControlPoint = clone(controlPoint)
  clonedControlPoint.distance = controlPoint.distance + offset
  return clonedControlPoint
}

export function newControlPoint (
  distance: ?number,
  point: Coordinate,
  permanent: boolean = false,
  props: any = {}
): ControlPoint {
  if (!distance && distance !== 0) {
    throw new Error('distance argument must be set when creating a new control point')
  }
  return {
    distance,
    id: generateUID(),
    permanent,
    point,
    ...props
  }
}

export function constructPoint (latlng: LatLng): GeoJsonPoint {
  const coords = ll.toCoordinates(latlng)
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coords
    }
  }
}

export async function constructStop (
  latlng: LatLng,
  feedId: string
): Promise<GtfsStop> {
  const stopLatLng = clickToLatLng(latlng)
  const result = await reverse(latlng)
  const stopId = generateUID()
  let stopName = `New Stop (${stopId})`
  if (result && result.address) {
    stopName = result.address.Address
  }
  return {
    stop_id: stopId,
    stop_name: stopName,
    feedId,
    ...stopLatLng
  }
}

/**
 * Ensure returned coordinates are valid.
 * A bug occurred in this function in a case where line-slice-along returned
 * an array with just the latlng values.
 *
 * @param  {Mixed} coords hopefully a valid array of coordinates
 * @return {Coordinate[]} a valid array of coordinates
 */
function ensureValidCoords (coords: ?any): Array<[number, number]> {
  return coords && coords.length > 0
    ? Array.isArray(coords[0]) ? coords : [coords]
    : []
}

function geojsonFromCoordinates (
  coordinates: ?Array<[number, number]>
): ?GeoJsonLinestring {
  return (
    coordinates && {
      type: 'Feature',
      geometry: {
        coordinates: coordinates,
        type: 'LineString'
      }
    }
  )
}

export function getControlPointSnap (controlPointGeoJson: GeoJsonPoint, coordinates: Coordinates) {
  const lineString: GeoJsonLinestring = ((geojsonFromCoordinates(coordinates): any): GeoJsonLinestring)

  // snap control point to line
  const snap = pointOnLine(lineString, controlPointGeoJson)
  const lineSegment = lineSlice(point(lineString.geometry.coordinates[0]), snap, lineString)

  // measure line segment
  const distTraveled = lineDistance(lineSegment, 'meters')
  return { snap, distTraveled }
}

export function getFeedBounds (
  feedSource: Feed,
  pad: number = 0
): [[number, number], [number, number]] {
  return feedSource && feedSource.latestValidation && feedSource.latestValidation.bounds
    ? [[feedSource.latestValidation.bounds.north + pad, feedSource.latestValidation.bounds.west - pad], [feedSource.latestValidation.bounds.south - pad, feedSource.latestValidation.bounds.east + pad]]
    : [[60, 60], [-60, -20]]
}

export function getPatternEndPoint (pattern: Pattern): LatLng {
  const coordinates = pattern.shape && pattern.shape.coordinates
  const patternStops = [...pattern.patternStops]
  let endPoint
  if (coordinates) {
    endPoint = ll.toLeaflet(coordinates[coordinates.length - 1])
  } else {
    if (!patternStops[0].stop_lon || !patternStops[0].stop_lat) {
      throw new Error('Pattern stop is missing coordinates')
    }
    endPoint = {lng: patternStops[0].stop_lon, lat: patternStops[0].stop_lat}
  }
  return endPoint
}

/**
 * Translate meters to kilometers
 *
 * @param  {Number} m number of meters
 * @return {Number}   number of kilometers
 */
function mToKm (m: number): number {
  return m / 1000
}

/**
 * Recalculate the shape coordinates and control points of a pattern after an edit
 *
 * @param  {ControlPoint[]}  controlPoints
 * @param  {Boolean} [defaultToStraightLine=true]
 * @param  {string}  [dragId=null]  A dragId to return for future reference
 * @param  {String}  editType either 'delete or update'
 * @param  {Boolean}  followStreets
 * @param  {Number}  index  The control point index.
 *   For delete, this point is removed and coordinates are recalculated between the remaining points
 *   For update, the coordinates are recalculated using the adjacent control points
 * @param  {LatLng}  newPoint  Must be sent for update operations
 * @param  {Object}  patternShape
 * @param  {Boolean}  [snapControlPointToNewSegment=false}]
 *   If true, snap the controlPoint's position to the newly created line segment
 * @return {Object} An object with the following fields:
 * - coordinates: The resulting coordinates of the linestring of the updated pattern shape
 * - updatedControlPoints: The updatedControlPoints after the recalcuation
 */
export async function recalculateShape ({
  controlPoints,
  defaultToStraightLine = true,
  dragId,
  editType,
  followStreets,
  index,
  newPoint,
  patternShape,
  snapControlPointToNewSegment = false
}: {
  controlPoints: Array<ControlPoint>,
  defaultToStraightLine: boolean,
  dragId: ?string,
  editType: string,
  followStreets: boolean,
  index: number,
  newPoint: ?Coordinate,
  patternShape: {
    coordinates: Coordinates
  },
  snapControlPointToNewSegment: boolean
}) {
  // validate arguments
  if (editType === 'update' && !newPoint) {
    throw new Error('newPoint argument is required when editType is "update"')
  }

  /**
   * Convenience function to return the coordinates from a lineSliceAlong operation
   *
   * @param  {Number} startDistance
   * @param  {Number} endDistance
   * @return {Coordinate[]}
   */
  function lineSliceAlongToCoords (startDistance, endDistance = null) {
    if (startDistance === 0 && endDistance === 0) {
      return []
    }
    const lineSegment = lineString(patternShape.coordinates)
    if (endDistance === null) {
      // If no end distance provided, use distance of pattern shape
      endDistance = lineDistance(lineSegment, 'kilometers')
    }
    return lineSliceAlong(
      lineSegment,
      startDistance,
      endDistance
    ).geometry.coordinates
  }

  let previousControlPoint = controlPoints[index - 1]
  const currentControlPoint = controlPoints[index]
  let followingControlPoint = controlPoints[index + 1]
  const lastControlPointDistance = mToKm(
    controlPoints[controlPoints.length - 1].distance
  )

  let previousCoords = []
  let followingCoords = []
  let updatedControlPoints = controlPoints.slice(0, index)

  // create points to make valhalla routing request
  // store previous and remaining coords to make new resulting coordinate array
  // create the resulting changes to the control points
  let points: Coordinates = []

  if (editType === 'update') {
    points = []
    if (index > 0) {
      // updating something after first stop
      points.push(previousControlPoint.point.geometry.coordinates)
      previousCoords = lineSliceAlongToCoords(
        0,
        mToKm(previousControlPoint.distance)
      )
    }
    points.push(ll.toCoordinates(newPoint))
    if (index < controlPoints.length - 1) {
      // updating something before last stop
      points.push(followingControlPoint.point.geometry.coordinates)
      followingCoords = lineSliceAlongToCoords(mToKm(followingControlPoint.distance))
    }
  } else if (editType === 'delete') {
    if (index === 0) {
      // deleting first stop.
      // Return coordinates and control points w/ updated distances of remaining stops
      const distanceOffset = -controlPoints[2].distance
      updatedControlPoints = controlPoints.slice(2).map(controlPoint =>
        cloneControlPointWithDistanceOffset(controlPoint, distanceOffset)
      )
      return {
        coordinates: ensureValidCoords(lineSliceAlongToCoords(
          mToKm(controlPoints[2].distance),
          lastControlPointDistance
        )),
        dragId,
        updatedControlPoints
      }
    } else if (index === controlPoints.length - 1) {
      // deleting last control point
      let nextToLastIndex = controlPoints.length - 2
      if (currentControlPoint.stopId) {
        // if the control point is a stop
        // delete all other control points until the next-to-last stop
        while (!controlPoints[nextToLastIndex].stopId && nextToLastIndex > 0) {
          nextToLastIndex--
        }
      }

      return {
        coordinates: ensureValidCoords(lineSliceAlongToCoords(
          0,
          mToKm(controlPoints[nextToLastIndex].distance)
        )),
        dragId,
        updatedControlPoints: controlPoints.slice(0, nextToLastIndex + 1)
      }
    } else {
      // deleting an in-between control point or stop
      if (currentControlPoint.stopId) {
        // deleting a stop.  Recalculate shape between the previous and following stops
        let previousStopIdx = index - 1
        while (!controlPoints[previousStopIdx].stopId && previousStopIdx > 0) {
          previousStopIdx--
        }
        previousControlPoint = controlPoints[previousStopIdx]

        let followingStopIdx = index + 1
        let nextStopFound = false
        for (; followingStopIdx < controlPoints.length; followingStopIdx++) {
          if (controlPoints[followingStopIdx].stopId) {
            nextStopFound = true
            break
          }
        }

        if (!nextStopFound) {
          // there are no more stops after this control point!
          // return the coordinates as far as the new last stop

          // set coords to null if last stop was deleted
          const newCoords = lineSliceAlongToCoords(
            0,
            mToKm(controlPoints[previousStopIdx].distance)
          )
          return {
            coordinates: newCoords.length > 0 ? ensureValidCoords(newCoords) : null,
            dragId,
            updatedControlPoints: controlPoints.slice(0, previousStopIdx + 1)
          }
        }

        followingControlPoint = controlPoints[followingStopIdx]
      }

      points = [
        previousControlPoint.point.geometry.coordinates,
        followingControlPoint.point.geometry.coordinates
      ]
      previousCoords = lineSliceAlongToCoords(
        0,
        mToKm(previousControlPoint.distance)
      )
      followingCoords = lineSliceAlongToCoords(
        mToKm(followingControlPoint.distance),
        lastControlPointDistance
      )
    }
  } else {
    throw new Error('Invalid editType')
  }

  // calculate new segment
  const newSegment = await getSegment(
    points,
    followStreets,
    defaultToStraightLine
  )

  if (!newSegment || !newSegment.coordinates) {
    return {
      coordinates: null,
      dragId,
      updatedControlPoints: null
    }
  }

  const segmentDistance = lineDistance(
    geojsonFromCoordinates(ensureValidCoords(newSegment.coordinates)),
    'meters'
  )

  if (editType === 'update') {
    const controlPointGeoJson = point(ll.toCoordinates(newPoint))
    if (snapControlPointToNewSegment) {
      const {snap, distTraveled} = getControlPointSnap(
        controlPointGeoJson,
        ensureValidCoords(newSegment.coordinates)
      )
      updatedControlPoints.push(
        newControlPoint(previousControlPoint.distance + distTraveled, snap, true)
      )
    } else {
      const updatedControlPoint = Object.assign({}, controlPoints[index])
      updatedControlPoint.point = controlPointGeoJson
      updatedControlPoints.push(updatedControlPoint)
    }
  }

  // update positions of the rest of the control points
  let offset
  if (editType === 'update' && index === 0) {
    offset = segmentDistance - followingControlPoint.distance
  } else if (editType === 'update' && index === controlPoints.length - 1) {
    // do nothing to avoid undefined error on followingControlPoint
    // following array slice method will not error cause array is empty
  } else {
    offset = segmentDistance - (followingControlPoint.distance - previousControlPoint.distance)
  }
  // console.log(`offseting following control points by ${offset}`)
  controlPoints.slice(index + 1).forEach(controlPoint =>
    updatedControlPoints.push(cloneControlPointWithDistanceOffset(controlPoint, offset))
  )

  // rebuild linestring
  return {
    coordinates: [
      ...ensureValidCoords(previousCoords),
      ...ensureValidCoords(newSegment.coordinates),
      ...ensureValidCoords(followingCoords)
    ],
    dragId,
    updatedControlPoints
  }
}

export async function route (from: LatLng, to: LatLng): Promise<any> {
  const r5url: ?string = getConfigProperty('application.r5')
  if (!r5url) {
    throw new Error('r5 url not set')
  }
  const url = `${r5url}/plan?fromLat=${from.lat}&fromLon=${from.lng}&toLat=${to.lat}&toLon=${to.lng}&mode=CAR&full=false`
  const response = await fetch(url)
  const json = await response.json()
  return json
}

export function stopToStopTime (stop: GtfsStop): StopTime {
  if (!stop.id) {
    throw new Error('Stop Id not set')
  }
  return {stopId: stop.id, defaultDwellTime: 0, defaultTravelTime: 0}
}

export async function street (from: LatLng, to: LatLng): Promise<any | null> {
  let json
  try {
    json = await route(from, to)
  } catch (e) {
    return null
  }
  if (json.errors) {
    console.log('error getting r5 data', json)
    return null
  } else {
    return json
  }
}
