import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import {AutoSizer} from 'react-virtualized/dist/commonjs/AutoSizer'
import {Grid} from 'react-virtualized/dist/commonjs/Grid' // cannot use MultiGrid due to lack of colspan support
import scrollbarSize from 'dom-helpers/util/scrollbarSize'
import objectPath from 'object-path'

import HeaderCell from './HeaderCell'
import EditableCell from './EditableCell'
import {
  getCellRenderer,
  getHeaderColumns,
  isTimeFormat,
  parseTime,
  OVERSCAN_ROW_COUNT,
  OVERSCAN_COLUMN_COUNT,
  HEADER_GRID_WRAPPER_STYLE,
  HEADER_GRID_STYLE,
  LEFT_GRID_WRAPPER_STYLE,
  LEFT_COLUMN_WIDTH,
  ROW_HEIGHT,
  LEFT_GRID_STYLE,
  TOP_LEFT_STYLE,
  MAIN_GRID_WRAPPER_STYLE,
  WRAPPER_STYLE
} from '../../util/timetable'

export default class TimetableGrid extends Component {
  static propTypes = {
    updateCellValue: PropTypes.func,
    toggleAllRows: PropTypes.func,
    selected: PropTypes.array,
    toggleRowSelection: PropTypes.func
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.hideDepartureTimes !== this.props.hideDepartureTimes) {
      // force grid refresh because grid column width must change
      this.grid.recomputeGridSize()
    }
  }

  /**
   * Handles a keypress event when the Timetable Grid is focused.
   * This occurs when an EditableCell is not in focus, but the grid is.
   * Whenever an EditableCell loses focus by an end in editing, the focus should
   * bubble up to this component.
   */
  handleKeyPress = (evt) => {
    const {
      activeCell,
      data,
      setActiveCell,
      scrollToColumn,
      scrollToRow,
      updateScroll
    } = this.props
    switch (evt.keyCode) {
      case 8: // DELETE
        // TODO: add delete cell value
        // updateCellValue('', rowIndex, `${scrollToRow}.${col.key}`)
        break
      case 9:  // tab
        this.offsetScrollCol(evt.shiftKey ? -1 : 1)
        evt.preventDefault()
        break
      case 13: // Enter
        if (!activeCell) {
          return setActiveCell(`${scrollToRow}-${scrollToColumn}`)
        } else {
          return setActiveCell(null)
        }
      case 37: // left
        // prevent browser back
        evt.preventDefault()
        // override ArrowKeyStepper
        evt.stopPropagation()

        // check if done with command key or ctrl
        if (evt.metaKey || evt.ctrlKey) {
          // move all the way to the first column
          updateScroll(scrollToRow, 0)
        } else {
          this.offsetScrollCol(-1)
        }

        // retain active focus on the grid
        this._focusOnGrid()
        break
      case 38: // up
        // check if done with command key or ctrl
        if (evt.metaKey || evt.ctrlKey) {
          // prevent default up behavior
          evt.preventDefault()
          // override ArrowKeyStepper
          evt.stopPropagation()

          // move all the way to top
          updateScroll(0, scrollToColumn)

          // retain active focus on the grid
          this._focusOnGrid()
        }
        break
      case 39: // right
        // prevent browser back
        evt.preventDefault()
        // override ArrowKeyStepper
        evt.stopPropagation()

        // check if done with command key or ctrl
        if (evt.metaKey || evt.ctrlKey) {
          // move all the way to the first column
          updateScroll(scrollToRow, this._getColumnCount() - 1)
        } else {
          this.offsetScrollCol(1)
        }

        // retain active focus on the grid
        this._focusOnGrid()
        break
      case 40: // down
        // check if done with command key or ctrl
        if (evt.metaKey || evt.ctrlKey) {
          // prevent default up behavior
          evt.preventDefault()
          // override ArrowKeyStepper
          evt.stopPropagation()

          // move all the way to the bottom
          updateScroll(data.length - 1, scrollToColumn)

          // retain active focus on the grid
          this._focusOnGrid()
        }
        break
      case 67:
        // handle copy
        if (evt.ctrlKey) {
          console.log('copy pasta')
        }
        return false
      default:
        break
    }
    // input was 0-9
    if (!activeCell && evt.keyCode >= 48 && evt.keyCode <= 57 && !evt.ctrlKey) {
      setActiveCell(`${scrollToRow}-${scrollToColumn}`)
    }
    // input was a-z
    if (!activeCell && evt.keyCode >= 65 && evt.keyCode <= 90 && !evt.ctrlKey) {
      setActiveCell(`${scrollToRow}-${scrollToColumn}`)
    }
  }

  _renderLeftHeaderCell = ({ columnIndex, key, rowIndex, style }) => (
    <HeaderCell // This is the select all checkbox
      key={key}
      onChange={this.props.toggleAllRows}
      style={style}
      selectable />
  )

  _renderLeftColumnCell = ({ columnIndex, key, rowIndex, style }) => (
    <HeaderCell // Select row checkbox
      active={this.props.selected.indexOf(rowIndex) !== -1}
      key={key}
      index={rowIndex}
      label={rowIndex + 1}
      onChange={this.props.toggleRowSelection}
      style={style}
      selectable />
  )

  _getColumnHeaderWidth = ({index}) => {
    const col = getHeaderColumns(this.props.columns)[index]
    return col.type === 'ARRIVAL_TIME' && !this.props.hideDepartureTimes
      ? col.width * 2
      : col
      ? col.width
      : 200
  }

  _renderHeaderCell = ({ columnIndex, key, rowIndex, style }) => {
    const col = getHeaderColumns(this.props.columns)[columnIndex]
    return (
      <HeaderCell
        key={key}
        active={this.props.selected.length > 0 && this.props.selected.length === this.props.data.length} // render column headers as active if all rows selected
        title={col.title ? col.title : col.name}
        label={col.name}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...style
        }} />
    )
  }

  handlePastedRows = (pastedRows, rowIndex, colIndex) => {
    const {addNewRow, columns, data, setActiveCell, hideDepartureTimes, updateCellValue, updateScroll} = this.props
    let activeRow = rowIndex
    let activeCol = colIndex
    // iterate over rows in pasted selection
    for (var i = 0; i < pastedRows.length; i++) {
      activeRow = rowIndex + i
      // construct new row if it doesn't exist
      if (typeof data[i + rowIndex] === 'undefined') {
        addNewRow()
      }
      // iterate over number of columns in pasted selection
      for (var j = 0; j < pastedRows[0].length; j++) {
        activeCol = colIndex + j
        const path = `${rowIndex + i}.${columns[colIndex + j].key}`
        const value = parseTime(pastedRows[i][j])
        updateCellValue(value, rowIndex + i, path)
        // if departure times are hidden, paste into adjacent time column
        const adjacentPath = `${rowIndex + i}.${columns[colIndex + j + 2].key}`
        if (hideDepartureTimes && isTimeFormat(columns[colIndex + j].type) && typeof objectPath.get(data, adjacentPath) !== 'undefined') {
          updateCellValue(value, rowIndex + i, adjacentPath)
        }
      }
    }
    setActiveCell(`${activeRow}-${activeCol}`)
    updateScroll(activeRow, activeCol)
  }

  _cellRenderer = ({ columnIndex, key, rowIndex, style }) => {
    const {activeCell, columns, data, scrollToRow, scrollToColumn, selected, hideDepartureTimes, updateScroll} = this.props
    // adjust columnIndex for hideDepartures (departure times will not be present in grid)
    const colIndex = hideDepartureTimes && columnIndex > 3 ? (columnIndex * 2) - 3 : columnIndex
    const isFocused = columnIndex === scrollToColumn && rowIndex === scrollToRow
    const isEditing = activeCell === `${rowIndex}-${columnIndex}`
    const col = columns[colIndex]
    const previousCol = columns[colIndex - 1]
    const row = data[rowIndex]

    const rowIsChecked = (selected[0] === '*' && selected.indexOf(rowIndex) === -1) ||
      (selected[0] !== '*' && selected.indexOf(rowIndex) !== -1)

    let val = objectPath.get(data[rowIndex], col.key)
    if (col.key === 'gtfsTripId' && val === null) {
      val = objectPath.get(data[rowIndex], 'id') !== 'new' ? objectPath.get(data[rowIndex], 'id') : null
    }
    const previousValue = previousCol && row && objectPath.get(row, previousCol.key)
    const isInvalid = isTimeFormat(col.type) && val >= 0 && val < previousValue && val !== null
    return (
      <EditableCell
        cellRenderer={getCellRenderer}
        column={col}
        columnIndex={columnIndex} // pass original index to prevent issues with updateScroll/scrollsync
        data={val}
        handlePastedRows={this.handlePastedRows}
        hideDepartureTimes={hideDepartureTimes}
        invalidData={isInvalid}
        isEditing={isEditing}
        isFocused={isFocused}
        isSelected={rowIsChecked}
        key={key}
        lightText={col.type === 'DEPARTURE_TIME'}
        offsetScrollCol={this.offsetScrollCol}
        onChange={this._onCellChange}
        onClick={updateScroll}
        onStopEditing={this.handleEndEditing}
        placeholder={col.placeholder}
        renderTime={isTimeFormat(col.type)}
        rowIndex={rowIndex}
        style={style}
        />
    )
  }

  /**
   * Handle a change in the value of a cell.
   *
   * This function gets called with a post-processed value from the `save`
   * method of EditableCell.  The value can be a time value or non-time entry
   * such as Trip Id or Headsign.
   */
  _onCellChange = (value, rowIndex, col, colIndex) => {
    const {
      activePattern,
      columns,
      data,
      hideDepartureTimes,
      updateCellValue
    } = this.props

    // Determine if the value is a time entry.
    if (isTimeFormat(col.type)) {
      // make sure stop time isn't null
      const splitColKeys = col.key.split('.')
      const stopTimeIdx = splitColKeys[1]
      const trip = data[rowIndex]
      const stopTime = trip.stopTimes[stopTimeIdx]
      if (!stopTime && col.key.indexOf('.') !== -1) {
        // If stop time is null and there is a '.' in the column key, create a
        // new stop time. If there is no '.', this is a frequency start/end
        // time, which does not need a new stop time entry.

        // get stop id from pattern
        const {stopId} = activePattern.patternStops[stopTimeIdx]

        // create filler stop time object
        updateCellValue(
          { stopId },
          rowIndex,
          `${rowIndex}.stopTimes.${stopTimeIdx}`
        )
      }
    }
    updateCellValue(value, rowIndex, `${rowIndex}.${col.key}`)
    // if departure times are hidden, set departure time value equal to arrival time
    const nextCol = columns[colIndex + 1]
    if (hideDepartureTimes && nextCol && nextCol.type === 'DEPARTURE_TIME') {
      updateCellValue(value, rowIndex, `${rowIndex}.${nextCol.key}`)
    }
  }

  handleEndEditing = () => {
    this.props.setActiveCell(null)
    // refocus on grid after editing is done
    this._focusOnGrid()
  }

  _focusOnGrid () {
    ReactDOM.findDOMNode(this.grid) && ReactDOM.findDOMNode(this.grid).focus()
  }

  _getColumnWidth = ({index}) => {
    const {columns, hideDepartureTimes} = this.props
    const i = hideDepartureTimes && index > 3 ? (index * 2) - 3 : index
    const col = columns[i]
    return col.type === 'ARRIVAL_TIME' && hideDepartureTimes
      ? col.width * 2
      : col
      ? col.width
      : 90
  }

  /**
   * A helper method to move the active column a certain amount of cells left or right.
   * This was initially added to help with handling tab and shift + tab events.
   * @param {number} offset the number of columns to offset, can be positive or negative
   */
  offsetScrollCol = (offset) => {
    const {scrollToColumn, scrollToRow, updateScroll} = this.props
    updateScroll(
      scrollToRow,
      Math.max(Math.min(scrollToColumn + offset, this._getColumnCount() - 1), 0)
    )
  }

  _getColumnCount () {
    const {columns, hideDepartureTimes} = this.props
    return hideDepartureTimes ? getHeaderColumns(columns).length : columns.length
  }

  render () {
    const {onScroll, scrollLeft, scrollTop, onSectionRendered, scrollToColumn, scrollToRow} = this.props
    const {style, data, columns, selected} = this.props
    const selectAll = selected.length === data.length
    const columnHeaderCount = getHeaderColumns(columns).length
    return (
      <div
        style={WRAPPER_STYLE}
        onKeyDown={this.handleKeyPress}>
        <div
          style={TOP_LEFT_STYLE}>
          <Grid // Top Left Cell
            cellRenderer={this._renderLeftHeaderCell}
            style={{outline: 'none'}}
            width={LEFT_COLUMN_WIDTH}
            height={ROW_HEIGHT}
            rowHeight={ROW_HEIGHT}
            columnWidth={LEFT_COLUMN_WIDTH}
            overscanColumnCount={1}
            overscanRowCount={1}
            rowCount={1}
            columnCount={1} />
        </div>
        <div style={{width: '100%', ...style}}>
          <AutoSizer>
            {({ width, height }) => (
              <div>
                <div
                  style={LEFT_GRID_WRAPPER_STYLE}>
                  <Grid // Left Side Column
                    overscanColumnCount={1}
                    overscanRowCount={OVERSCAN_ROW_COUNT}
                    style={LEFT_GRID_STYLE}
                    cellRenderer={this._renderLeftColumnCell}
                    columnWidth={LEFT_COLUMN_WIDTH}
                    columnCount={1}
                    selectAll={selectAll} // pass as bool prop to force update when all rows toggled
                    scrollTop={scrollTop}
                    height={height - scrollbarSize()}
                    rowHeight={ROW_HEIGHT}
                    rowCount={data.length}
                    width={LEFT_COLUMN_WIDTH} />
                </div>
                <div
                  style={{
                    width: width - scrollbarSize(),
                    ...HEADER_GRID_WRAPPER_STYLE
                  }}>
                  <Grid // Top Header Row
                    style={HEADER_GRID_STYLE}
                    columnWidth={this._getColumnHeaderWidth}
                    columnCount={columnHeaderCount} // columns.length
                    height={ROW_HEIGHT}
                    overscanColumnCount={OVERSCAN_COLUMN_COUNT}
                    overscanRowCount={1}
                    cellRenderer={this._renderHeaderCell}
                    rowHeight={ROW_HEIGHT}
                    rowCount={1}
                    scrollLeft={scrollLeft}
                    width={width - scrollbarSize() - LEFT_COLUMN_WIDTH} />
                </div>
                <div
                  style={MAIN_GRID_WRAPPER_STYLE}>
                  <Grid // Primary timetable grid
                    ref={Grid => { this.grid = Grid }}
                    style={{outline: 'none'}}
                    columnWidth={this._getColumnWidth}
                    columnCount={this._getColumnCount()}
                    height={height}
                    onScroll={onScroll}
                    overscanColumnCount={OVERSCAN_COLUMN_COUNT}
                    overscanRowCount={OVERSCAN_ROW_COUNT}
                    onSectionRendered={onSectionRendered}
                    cellRenderer={this._cellRenderer}
                    rowHeight={ROW_HEIGHT}
                    rowCount={data.length}
                    scrollToColumn={scrollToColumn}
                    scrollToRow={scrollToRow}
                    width={width - scrollbarSize() - LEFT_COLUMN_WIDTH} />
                </div>
              </div>
            )}
          </AutoSizer>
        </div>
      </div>
    )
  }
}
