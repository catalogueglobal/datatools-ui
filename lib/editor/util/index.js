// @flow

import {getGtfsSpec} from '../../common/util/config'
import type {
  Feed,
  GtfsFare,
  GtfsStop,
  Pattern,
  Project,
  Trip,
  User,
  ZoneInfo
} from '../../types'

export const CLICK_OPTIONS: Array<string> = [
  'DRAG_HANDLES',
  'ADD_STOP_AT_CLICK',
  'ADD_STOPS_AT_INTERVAL',
  'ADD_STOPS_AT_INTERSECTIONS'
]
export const YEAR_FORMAT: string = 'YYYY-MM-DD'
export const EXCEPTION_EXEMPLARS = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
  NO_SERVICE: 7,
  CUSTOM: 8,
  SWAP: 9
}

export function getStopsForPattern (pattern: Pattern, stops: Array<GtfsStop>): Array<GtfsStop> {
  return pattern && pattern.patternStops && stops
    ? pattern.patternStops.map(ps => {
      const foundStop = stops.find(s => s.stop_id === ps.stopId)
      if (!foundStop) throw new Error(`Stop not found for pattern stop: ${JSON.stringify(ps)}`)
      return foundStop
    })
    : []
}

export function sortAndFilterTrips (
  trips: ?Array<Trip>,
  useFrequency: boolean
): Array<Trip> {
  return trips
    ? trips
      // filter out based on useFrequency
      .filter(t => t.useFrequency === useFrequency)
      // Sort by first arrival time. If they are the same, fall back on first
      // departure time. Finally, sort by trip ID.
      .sort((a, b) => {
        // There may be a case where a null value (skipped stop) appears first
        // in the list of stopTimes. In this case, we want to compare on the
        // first stopTime that exists for each pair of trips.
        let aStopTime, bStopTime
        let count = 0
        while (!aStopTime || !bStopTime) {
          aStopTime = a.stopTimes[count]
          bStopTime = b.stopTimes[count]
          count++
        }
        if (aStopTime.arrivalTime < bStopTime.arrivalTime) {
          return -1
        } else if (
          aStopTime.arrivalTime > bStopTime.arrivalTime
        ) {
          return 1
        }
        if (aStopTime.departureTime < bStopTime.departureTime) {
          return -1
        } else if (aStopTime.departureTime > bStopTime.departureTime) {
          return 1
        }
        return a.tripId.localeCompare(b.tripId)
      })
    : []
}

export function getZones (
  stops: ?Array<GtfsStop>,
  activeStop: ?GtfsStop
): ZoneInfo {
  const zones = {}
  if (stops) {
    for (var i = 0; i < stops.length; i++) {
      const stop = stops[i]
      const {zone_id: zoneId} = stop
      // eslint-disable-next-line camelcase
      if (zoneId) {
        let zone = zones[zoneId]
        if (!zone) {
          zone = []
        }
        zone.push(stop)
        zones[zoneId] = zone
      }
    }
    // add any new zone
    if (activeStop && activeStop.zone_id && !zones[activeStop.zone_id]) {
      const {zone_id: zoneId} = activeStop
      let zone = zones[zoneId]
      if (!zone) {
        zone = []
      }
      zone.push(activeStop)
      zones[zoneId] = zone
    }
  }
  const zoneOptions = Object.keys(zones).map(key => {
    return {
      value: key,
      label: `${key} zone (${zones[key] ? zones[key].length : 0} stops)`
    }
  })
  return {zones, zoneOptions}
}

// used to select the table from gtfs.yml to be used for
// validating and populating fields in editor (EntityDetails)
export function getEditorTable (component: string) {
  const spec = getGtfsSpec()
  if (!spec) {
    throw new Error('Editor spec could not be found!')
  }
  return spec.find(
    t =>
      component === 'fare' ? t.id === 'fare_attributes' : t.id === component
  )
}

export function canApproveGtfs (project: Project, feedSource: Feed, user: ?User): boolean {
  return !!(
    project &&
    feedSource &&
    user &&
    user.permissions &&
    user.permissions.hasFeedPermission(
      project.organizationId,
      project.id,
      feedSource.id,
      'approve-gtfs'
    )
  )
}

export function getFareRuleFieldName (fare: GtfsFare, ruleIndex: number) {
  return `fare_rule:${fare.fare_rules.length - ruleIndex}`
}
