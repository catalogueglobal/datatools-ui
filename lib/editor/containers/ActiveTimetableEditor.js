import { connect } from 'react-redux'

import {
  saveTripsForCalendar,
  deleteTripsForCalendar,
  fetchCalendarTripCountsForPattern,
  offsetRows,
  updateCellValue,
  setActiveCell,
  setScrollIndexes,
  toggleRowSelection,
  toggleAllRows,
  toggleDepartureTimes,
  addNewTrip,
  // saveNewTrip,
  removeTrips,
  setOffset
} from '../actions/trip'
import TimetableEditor from '../components/timetable/TimetableEditor'
import {getTableById} from '../util/gtfs'
import {getTripCounts} from '../selectors'
import {getTimetableColumns} from '../selectors/timetable'

const mapStateToProps = (state, ownProps) => {
  const {active, tables} = state.editor.data
  const {
    subEntityId: activePatternId,
    subSubEntityId: activeScheduleId
  } = active
  const {timetable} = state.editor
  const tripCounts = getTripCounts(state)
  const columns = getTimetableColumns(state)
  timetable.columns = columns
  const {subEntity: activePattern} = active
  const activeSchedule = getTableById(tables, 'calendar')
    .find(c => c.service_id === activeScheduleId)
  return {
    activePatternId,
    activeScheduleId,
    activePattern,
    activeSchedule,
    timetable,
    tripCounts
  }
}

const mapDispatchToProps = {
  // NOTE: fetchTripsForCalendar is mapped to props in ActiveGtfsEditor where it
  // is used to fetch trips
  saveTripsForCalendar,
  deleteTripsForCalendar,
  fetchCalendarTripCountsForPattern,
  // TIMETABLE FUNCTIONS
  updateCellValue,
  setActiveCell,
  setScrollIndexes,
  addNewTrip, // : saveNewTrip,
  offsetRows,
  removeTrips,
  toggleAllRows,
  toggleRowSelection,
  toggleDepartureTimes,
  setOffset
}

const ActiveTimetableEditor = connect(mapStateToProps, mapDispatchToProps)(TimetableEditor)

export default ActiveTimetableEditor
