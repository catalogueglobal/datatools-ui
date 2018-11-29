// @flow
import {createSelector} from 'reselect'

import {getAbbreviatedStopName, getTableById} from '../util/gtfs'
import type {
  GtfsStop,
  Pattern,
  TimetableColumn
} from '../../types'

const getActivePattern = (state) => state.editor.data.active.subEntity
const getStops = state => getTableById(state.editor.data.tables, 'stop')

export const getTimetableColumns = createSelector(
  [ getActivePattern, getStops ],
  (pattern: Pattern, stops: Array<GtfsStop>): Array<TimetableColumn> => {
    const columns = [
      {
        name: 'Block ID',
        width: 60,
        key: 'blockId',
        type: 'TEXT',
        placeholder: '300'
      },
      {
        name: 'Trip ID',
        width: 200,
        key: 'tripId',
        type: 'TEXT',
        placeholder: '12345678'
      },
      {
        name: 'Trip Headsign',
        width: 200,
        key: 'tripHeadsign',
        type: 'TEXT',
        placeholder: 'Destination via Transfer Center'
      }
    ]
    if (pattern && pattern.patternStops) {
      if (!pattern.useFrequency) {
        pattern.patternStops.map((ps, index) => {
          const stop = stops ? stops.find(st => st.stop_id === ps.stopId) : null
          const stopName = stop ? stop.stop_name : ps.stopId
          const stopId = stop && stop.stop_code
            ? stop.stop_code
            : stop && stop.stop_id
              ? stop.stop_id
              : ''
          const abbreviatedStopName = stop
            ? getAbbreviatedStopName(stop)
            : ps.stopId
          const TIME_WIDTH = 80
          columns.push({
            name: abbreviatedStopName,
            title: `${stopName} (${stopId})`,
            width: TIME_WIDTH,
            key: `stopTimes.${index}.arrivalTime`,
            colSpan: '2',
            // hidden: false,
            type: 'ARRIVAL_TIME',
            placeholder: 'HH:MM:SS'
          })
          columns.push({
            key: `stopTimes.${index}.departureTime`,
            width: TIME_WIDTH,
            // hidden: hideDepartureTimes,
            type: 'DEPARTURE_TIME',
            placeholder: 'HH:MM:SS'
          })
        })
      } else {
        // columns added if using freqency schedule type
        columns.push({
          name: 'Start time',
          width: 100,
          key: 'frequencies.0.startTime',
          type: 'TIME',
          placeholder: 'HH:MM:SS'
        })
        columns.push({
          name: 'End time',
          width: 100,
          key: 'frequencies.0.endTime',
          type: 'TIME',
          placeholder: 'HH:MM:SS'
        })
        columns.push({
          name: 'Headway',
          width: 60,
          key: 'frequencies.0.headwaySecs',
          type: 'MINUTES',
          placeholder: '900 (sec)'
        })
        // columns.push({
        //   name: 'Exact times',
        //   width: 60,
        //   key: 'frequencies.0.exactTimes',
        //   type: 'MINUTES',
        //   placeholder: '15 (min)'
        // })
      }
    }
    return columns
  }
)
