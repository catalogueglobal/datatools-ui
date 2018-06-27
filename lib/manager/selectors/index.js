// @flow

import {createSelector} from 'reselect'

import {secondsAfterMidnightToHHMM} from '../../common/util/gtfs'
import {getEntityName} from '../../editor/util/gtfs'

import type {Stop} from '../../gtfs/reducers/patterns'
import type {Stop as TimetableStop} from '../../gtfs/reducers/timetables'
import type {AppState} from '../../types'

type Column = {
  colSpan?: string,
  dataField?: string,
  isKey?: boolean,
  name: string,
  row: string,
  rowSpan?: string,
  width: string
}

export type RouteRowData = {
  numPatterns: number,
  numStops: number,
  numTrips: number,
  routeId: string,
  routeName: string,
  tripsPerHour: Array<number>
}

export type PatternRowData = {
  numStops: number,
  numTrips: number,
  patternId: string,
  patternName: string,
  tripsPerHour: Array<number>
}

const getActiveProjectId = (state: AppState) => state.projects.active
const getProjects = (state: AppState) => state.projects.all

export const getActiveProject: AppState => any = createSelector(
  [getActiveProjectId, getProjects],
  (activeProjectId, projects) => {
    return projects && projects.find(p => p.id === activeProjectId)
  }
)

export const getFilteredStops: AppState => Array<Stop> = createSelector(
  [ state => state.gtfs.patterns, state => state.gtfs.filter.patternFilter ],
  (patterns, patternFilter) => {
    const stopsInFilteredPattern = {}
    if (patternFilter) {
      patterns.data.patterns.forEach(pattern => {
        if (pattern.pattern_id === patternFilter) {
          pattern.stops.forEach(stop => {
            stopsInFilteredPattern[stop.stop_id] = true
          })
        }
      })
    }
    return patterns.data.stops.filter(
      stop => !patternFilter || stopsInFilteredPattern[stop.stop_id]
    )
  }
)

export const getPatternData: AppState => Array<PatternRowData> = createSelector(
  [state => state.gtfs.patterns.data.patterns],
  patterns => {
    return patterns.map(pattern => {
      const tripsPerHour = Array(28).fill(0)
      pattern.trips.forEach(trip => {
        tripsPerHour[Math.floor(trip.stop_times[0].arrival_time / 3600)]++
      })
      return {
        numStops: pattern.stops.length,
        numTrips: pattern.trips.length,
        patternId: pattern.pattern_id,
        patternName: pattern.name,
        tripsPerHour
      }
    })
  }
)

export const getRouteData: AppState => Array<RouteRowData> = createSelector(
  [state => state.gtfs.routes.routeDetails.data],
  data => {
    if (!data) return []

    return data.routes.map(route => {
      const patternLookup = {}
      const tripsPerHour = Array(28).fill(0)
      route.trips.forEach(trip => {
        patternLookup[trip.pattern_id] = true
        tripsPerHour[Math.floor(trip.stop_times[0].arrival_time / 3600)]++
      })
      return {
        numPatterns: Object.keys(patternLookup).length,
        numStops: route.stops.length,
        numTrips: route.trips.length,
        routeId: route.route_id,
        // cast to make flow happy
        routeName: getEntityName((route: any)),
        tripsPerHour
      }
    })
  }
)

export const getTimetableData: AppState => {
  columns: Array<Column>,
  rows: Array<any>
} = createSelector(
  [
    state => state.gtfs.timetables,
    state => state.gtfs.filter.showArrivals,
    state => state.gtfs.filter.timepointFilter
  ],
  /**
   * Create a list of columns and rows to render a bootstrap table
   * This function is dependent on the data in the gtfs.timetables reducers and
   * also gtfs.filter
   * if the showArrivals filter is set to true, we need to create an extra header row that
   * will display the arrival and departure columns beneath each stop
   * if the titimepointFilter is set to true, we only show stops that have at
   * least one stop time that has a non-blank value
   */
  (timetables, showArrivals, timepointFilter) => {
    if (!timetables.data || !timetables.data.feed) return {columns: [], rows: []}

    // assume 1st pattern is the only one we're interested in
    const pattern = timetables.data.feed.patterns[0]

    // there could be no patterns found or no trips associate with that pattern
    // if eiter happens, return blank
    if (!pattern || pattern.trips.length === 0) return {columns: [], rows: []}

    // create stop lookup because the stops come back out-of-order
    const stopLookup: { [string]: TimetableStop } = {}
    const stopHasStopTimeWithTime: { [string]: boolean } = {}
    pattern.stops.forEach(stop => {
      stopLookup[stop.stop_id] = stop
    })

    // begin making column headers with trip info
    let columns: Array<Column> = [
      {
        dataField: 'tripId',
        isKey: true,
        name: 'Trip ID',
        rowSpan: showArrivals ? '2' : '1',
        row: '0',
        width: '150'
      },
      {
        dataField: 'tripHeadsign',
        name: 'Trip Headsign',
        rowSpan: showArrivals ? '2' : '1',
        row: '0',
        width: '150'
      },
      {
        dataField: 'tripShortName',
        name: 'Trip Short Name',
        rowSpan: showArrivals ? '2' : '1',
        row: '0',
        width: '150'
      }
    ]

    // make rest of the row headers by making stop names as headers
    // assume that the first trip is representative of stops in timetable
    const firstTrip = pattern.trips[0]

    // sort stop times by stop_sequence just in case
    const stopColWidth = 200
    firstTrip.stop_times.forEach(stopTime => {
      const { stop_id: stopId } = stopTime
      // add header columns depending on whether arrivals need to be shown
      columns.push({
        colSpan: showArrivals ? '2' : '1',
        dataField: showArrivals ? undefined : `stop-${stopId}-departure`,
        name: stopLookup[stopId].stop_name,
        row: '0',
        width: `${stopColWidth}`
      })
      if (showArrivals) {
        columns.push({
          dataField: `stop-${stopId}-arrival`,
          name: 'Arrive',
          row: '1',
          width: `${stopColWidth / 2}`
        })
        columns.push({
          dataField: `stop-${stopId}-departure`,
          name: 'Depart',
          row: '1',
          width: `${stopColWidth / 2}`
        })
      }
    })

    // add row data
    const rows = pattern.trips.map(trip => {
      const row = {
        tripId: trip.trip_id,
        tripHeadsign: trip.trip_headsign,
        tripShortName: trip.trip_short_name
      }
      trip.stop_times.forEach(stopTime => {
        if (
          isNumber(stopTime.arrival_time) ||
          isNumber(stopTime.departure_time)
        ) {
          stopHasStopTimeWithTime[stopTime.stop_id] = true
        }
        // also store the raw value in order to sort rows based off of time
        row[`stop-${stopTime.stop_id}-arrival-raw`] = stopTime.arrival_time
        row[`stop-${stopTime.stop_id}-arrival`] = secondsAfterMidnightToHHMM(
          stopTime.arrival_time
        )
        row[`stop-${stopTime.stop_id}-departure-raw`] = stopTime.departure_time
        row[`stop-${stopTime.stop_id}-departure`] = secondsAfterMidnightToHHMM(
          stopTime.departure_time
        )
      })
      return row
    })

    // sort rows based off of the first non-blank stop time that each row shares
    rows.sort((a, b) => {
      for (let i = 0; i < firstTrip.stop_times.length; i++) {
        const stopId = firstTrip.stop_times[i].stop_id
        const arrivalKey = `stop-${stopId}-arrival-raw`
        if (isNumber(a[arrivalKey]) && isNumber(b[arrivalKey])) {
          return a[arrivalKey] - b[arrivalKey]
        }
        const departKey = `stop-${stopId}-departure-raw`
        if (isNumber(a[departKey]) && isNumber(b[departKey])) {
          return a[departKey] - b[departKey]
        }
      }
      return 0
    })

    if (timepointFilter) {
      // remove stop time columns that have only interpolated stop times
      columns = columns.filter(col => {
        const matches =
          col.dataField && col.dataField.match(/stop-(.*)-(departure|arrival)/)
        // no match, not a stop time column, therefore we keep
        if (!matches) return true

        // is a stop time column, check to see if there are any non-interpolated times
        const stopId = matches[1]
        return stopHasStopTimeWithTime[stopId]
      })
    }

    return {columns, rows}
  }
)

function isNumber (n) {
  return typeof n === 'number'
}
