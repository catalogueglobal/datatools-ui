// @flow

import fetch from 'isomorphic-fetch'
import {decode as decodePolyline} from 'polyline'
import {isEqual as coordinatesAreEqual} from '@conveyal/lonlat'
import lineString from 'turf-linestring'
import lineSliceAlong from '@turf/line-slice-along'

import type {
  Coordinates,
  LatLng
} from '../../types'

type SignText = {
  text: string
}

type Maneuver = {
  begin_shape_index: number,
  begin_street_names?: Array<string>,
  end_shape_index: number,
  instruction: string,
  length: number,
  sign?: {
    exit_branch_elements?: Array<SignText>,
    exit_number_elements?: Array<SignText>,
    exit_toward_elements?: Array<SignText>
  },
  street_names?: Array<string>,
  time: number,
  toll?: boolean,
  travel_mode: string,
  travel_type: string,
  type: number,
  verbal_multi_cue?: boolean,
  verbal_post_transition_instruction?: string,
  verbal_pre_transition_instruction: string,
  verbal_transition_alert_instruction?: string
}

type Leg = {
  shape: string,
  summary: {
    max_lon: number,
    max_lat: number,
    time: number,
    length: number,
    min_lat: number,
    min_lon: number
  },
  maneuvers: Array<Maneuver>
}

type Location = {
  street: string,
  lon: number,
  lat: number,
  type: string
}

type ValhallaResponse = {
  id: string,
  trip: {
    language: string,
    summary: {
      max_lon: number,
      max_lat: number,
      time: number,
      length: number,
      min_lat: number,
      min_lon: number
    },
    locations: Array<Location>,
    units: string,
    legs: Array<Leg>,
    status_message: string,
    status: number
  }
}

/**
 * Convert GraphHopper routing JSON response to polyline.
 */
function handleGraphHopperRouting (json, individualLegs = false) {
  if (json && json.paths && json.paths[0]) {
    const decodedPolyline = decodePolyline(json.paths[0].points)
      .map(coordinate => ([coordinate[1], coordinate[0]]))
    // console.log('decoded polyline', json.paths[0].points, decodedPolyline)
    if (individualLegs) {
      // Reconstruct individual legs from the instructions. NOTE: we do not simply
      // use the waypoints found in the response because for lines that share
      // street segments, slicing on these points results in unpredictable splits.
      // Slicing the line along distances is much more reliable.
      const segments = []
      const waypointDistances = [0]
      let distance = 0
      json.paths[0].instructions.forEach(instruction => {
        // Iterate over the instructions, accumulating distance and storing the
        // distance at each waypoint encountered.
        if (instruction.text.match(/Waypoint (\d+)/)) {
          // console.log(`adding waypoint ${waypointDistances.length} at ${distance} meters`)
          waypointDistances.push(distance)
        } else {
          distance += instruction.distance
        }
      })
      // Add last distance measure.
      // FIXME: Should this just be the length of the entire line?
      // console.log(waypointDistances, json.paths[0].distance)
      waypointDistances.push(distance)
      const decodedLineString = lineString(decodedPolyline)
      if (waypointDistances.length > 2) {
        for (var i = 1; i < waypointDistances.length; i++) {
          const slicedSegment = lineSliceAlong(
            decodedLineString,
            waypointDistances[i - 1] / 1000,
            waypointDistances[i] / 1000
          )
          segments.push(slicedSegment.geometry.coordinates)
        }
        // console.log('individual legs', segments)
        return segments
      } else {
        // FIXME does this work for two input points?
        return [decodedPolyline]
      }
    } else {
      return decodedPolyline
    }
  } else {
    return null
  }
}

/**
 * Convert Mapzen routing JSON response to polyline.
 */
export function handleMapzenRouting (json, individualLegs = false) {
  if (json && json.trip) {
    const legArray = json.trip.legs.map((leg, index) => {
      return decodePolyline(leg.shape)
        .map((c, index) => [c[1] / 10, c[0] / 10]) // Mapzen or Mapbox is encoding/decoding wrong?
    })
    return individualLegs
      ? legArray
      : [].concat.apply([], legArray)
  } else {
    return null
  }
}

/**
 * Call Mapzen routing service with set of lat/lng coordinates.
 */
export function routeWithMapzen (points: Array<LatLng>): ?Promise<ValhallaResponse> {
  if (points.length < 2) {
    console.warn('need at least two points to route with mapzen', points)
    return null
  }
  if (!process.env.MAPZEN_TURN_BY_TURN_KEY) {
    throw new Error('MAPZEN_TURN_BY_TURN_KEY not set')
  }
  const MAPZEN_TURN_BY_TURN_KEY: string = process.env.MAPZEN_TURN_BY_TURN_KEY
  const locations = points.map(p => ({lon: p.lng, lat: p.lat}))
  const json = {
    costing: 'bus',
    locations
  }
  return fetch(
    `https://valhalla.mapzen.com/route?json=${JSON.stringify(
      json
    )}&api_key=${MAPZEN_TURN_BY_TURN_KEY}`
  ).then(res => res.json())
}

/**
 * Route between two or more points using external routing service.
 * @param  {[type]} points         array of two or more LatLng points
 * @param  {[type]} individualLegs whether to return coordinates as set of
 *                                 distinct segments for each pair of points
 * @param  {[type]} useMapzen      FIXME: not implemented. boolean to select service to use.
 * @return {[type]}                Array of coordinates or Array of arrays of coordinates.
 */
export async function polyline (
  points: Array<LatLng>,
  individualLegs: boolean = false,
  useMapzen: boolean = true
): Promise<?Array<[number, number]>> {
  let json
  try {
    json = await routeWithGraphHopper(points)
  } catch (e) {
    console.log(e)
    return null
  }
  const geometry = handleGraphHopperRouting(json, individualLegs)
  return geometry
}

export async function getSegment (
  points: Coordinates,
  followRoad: boolean,
  defaultToStraightLine: boolean = true
): Promise<?{
  type: 'LineString',
  coordinates: Coordinates
}> {
  // Store geometry to be returned here.
  let geometry
  if (followRoad) {
    // if snapping to streets, use routing service.
    const coordinates = await polyline(
      points.map(p => ({lng: p[0], lat: p[1]}))
    )
    if (!coordinates) {
      // If routing was unsuccessful, default to straight line (if desired by
      // caller).
      console.warn(`Routing unsuccessful. Returning ${defaultToStraightLine ? 'straight line' : 'null'}.`)
      if (defaultToStraightLine) {
        geometry = lineString(points).geometry
      } else {
        return null
      }
    } else {
      // If routing is successful, clean up shape if necessary
      const c0 = coordinates[0]
      const epsilon = 1e-6
      if (!coordinatesAreEqual(c0, points[0], epsilon)) {
        coordinates.unshift(points[0])
      }
      geometry = {
        type: 'LineString',
        coordinates
      }
    }
  } else {
    // If not snapping to streets, simply generate a line string from input
    // coordinates.
    geometry = lineString(points).geometry
  }
  return geometry
}

/**
 * Call GraphHopper routing service with lat/lng coordinates.
 */
export function routeWithGraphHopper (points: Array<LatLng>): ?Promise<any> {
  // https://graphhopper.com/api/1/route?point=49.932707,11.588051&point=50.3404,11.64705&vehicle=car&debug=true&&type=json
  if (points.length < 2) {
    console.warn('need at least two points to route with graphhopper', points)
    return null
  }
  if (!process.env.GRAPH_HOPPER_KEY) {
    throw new Error('GRAPH_HOPPER_KEY not set')
  }
  const GRAPH_HOPPER_KEY: string = process.env.GRAPH_HOPPER_KEY
  const locations = points.map(p => (`point=${p.lat},${p.lng}`)).join('&')
  return fetch(
    `https://graphhopper.com/api/1/route?${locations}&key=${GRAPH_HOPPER_KEY}&vehicle=car&debug=true&&type=json`
  ).then(res => res.json())
}

/**
 * Call Mapbox routing service with set of lat/lng coordinates.
 */
export function routeWithMapbox (points: Array<LatLng>): ?Promise<any> {
  if (points.length < 2) {
    console.warn('need at least two points to route with mapbox', points)
    return null
  }
  if (!process.env.MAPBOX_ACCESS_TOKEN) {
    throw new Error('MAPBOX_ACCESS_TOKEN not set')
  }
  const MAPBOX_ACCESS_TOKEN: string = process.env.MAPBOX_ACCESS_TOKEN
  // const locations = points.map(p => ({lon: p.lng, lat: p.lat}))
  const locations = points.map(p => (`${p.lng},${p.lat}`)).join(';')
  return fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${locations}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
  ).then(res => res.json())
}

// /**
//  * Convert Mapbox routing JSON response to polyline.
//  */
// function handleMapboxRouting (json) {
//   if (json && json.routes && json.routes[0]) {
//     // Return decoded polyline on route geometry (by default Mapbox returns a
//     // single route with entire geometry contained therein).
//     // return json.routes[0].geometry.coordinates
//     const decodedPolyline = decodePolyline(json.routes[0].geometry)
//     console.log('decoded polyline', json.routes[0].geometry, decodedPolyline)
//     return decodedPolyline.map((c, index) => ([c[1], c[0]])) // index === 0 ? c :
//   } else {
//     return null
//   }
// }
