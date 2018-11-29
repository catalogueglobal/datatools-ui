// @flow

import React, {Component} from 'react'
import {Button} from 'react-bootstrap'
import {ArrowKeyStepper} from 'react-virtualized/dist/commonjs/ArrowKeyStepper'
import {ScrollSync} from 'react-virtualized/dist/commonjs/ScrollSync'

import Loading from '../../../common/components/Loading'
import {getHeaderColumns, isTimeFormat} from '../../util/timetable'
import type {Pattern, TimetableColumn, Trip} from '../../../types'
import type {TimetableState} from '../../../types/reducers'

import TimetableGrid from './TimetableGrid'
import type {CellData} from './EditableCell'

type Props = {
  activeCell: ?string,
  activePattern: Pattern,
  activeScheduleId: string,
  addNewRow: (?boolean, ?boolean) => void,
  cloneSelectedTrips: () => void,
  columns: Array<TimetableColumn>,
  data: Array<Trip>,
  offsetWithDefaults: (boolean) => void,
  removeSelectedRows: () => void,
  saveEditedTrips: (Pattern, string) => void,
  scrollToColumn: number,
  scrollToRow: number,
  setActiveCell: ?string => void,
  setOffset: number => void,
  setScrollIndexes: ({scrollToColumn: number, scrollToRow: number}) => void,
  showHelpModal: () => void,
  style: {[string]: number | string},
  timetable: TimetableState,
  toggleAllRows: ({active: boolean}) => void,
  toggleRowSelection: ({active: boolean, rowIndex: number}) => void,
  updateCellValue: ({key: string, rowIndex: number, value: any}) => void
}

export default class Timetable extends Component<Props> {
  keyStepper = null

  updateScroll = (scrollToRow: number, scrollToColumn: number) => {
    this.keyStepper && this.keyStepper.setScrollIndexes({scrollToRow, scrollToColumn})
    if (this.props.scrollToRow !== scrollToRow || this.props.scrollToColumn !== scrollToColumn) {
      this.props.setScrollIndexes({scrollToRow, scrollToColumn})
    }
  }

  cellValueInvalid = (col: TimetableColumn, value: CellData, previousValue: CellData) =>
    isTimeFormat(col.type) && typeof value === 'number' && value >= 0 && value < +previousValue

  render () {
    const {
      addNewRow,
      timetable,
      scrollToRow,
      scrollToColumn,
      setActiveCell,
      updateCellValue
    } = this.props
    const {columns, trips: data, selected, hideDepartureTimes} = timetable
    // if no columns (and no data), page is still loading
    if (columns.length === 0 && data.length === 0) {
      return (
        <div style={{marginTop: '20px'}}>
          <Loading />
        </div>
      )
    } else if (data.length === 0) {
      // if no data, then no trips have been created
      return (
        <div>
          <p className='text-center lead'>
            No trips for calendar.
            {' '}
            <Button
              bsStyle='success'
              data-test-id='add-new-trip-button'
              onClick={addNewRow}
            >
              Add new trip.
            </Button>
          </p>
        </div>
      )
    }
    const {activeCell} = timetable
    const columnCount = hideDepartureTimes
      ? getHeaderColumns(columns).length
      : columns.length
    return (
      <ScrollSync>
        {(syncProps: {
          clientHeight: number,
          clientWidth: number,
          onScroll: any => void,
          scrollHeight: number,
          scrollLeft: number,
          scrollTop: number,
          scrollWidth: number
        }) => {
          return (
            <div data-test-id='timetable-area'>
              <ArrowKeyStepper
                columnCount={columnCount}
                mode={'cells'}
                ref={ArrowKeyStepper => { this.keyStepper = ArrowKeyStepper }}
                disabled={activeCell !== null}
                scrollToColumn={scrollToColumn} // initial value
                scrollToRow={scrollToRow} // initial value
                rowCount={data.length}>
                {(stepperProps: {
                  onSectionRendered: any => void,
                  scrollToColumn: number,
                  scrollToRow: number
                }) => (
                  <TimetableGrid
                    activeCell={activeCell}
                    data={data}
                    selected={selected}
                    updateScroll={this.updateScroll}
                    updateCellValue={updateCellValue}
                    columns={columns}
                    hideDepartureTimes={hideDepartureTimes}
                    saveEditedTrips={this.props.saveEditedTrips}
                    setActiveCell={setActiveCell}
                    {...this.props}
                    {...stepperProps}
                    {...syncProps} />
                )}
              </ArrowKeyStepper>
            </div>
          )
        }}
      </ScrollSync>
    )
  }
}
