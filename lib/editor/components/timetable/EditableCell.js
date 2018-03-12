import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'

import { TIMETABLE_FORMATS } from '../../util/timetable'

/**
 * A component to handle the editing of a cell in a timetable editor
 */
export default class EditableCell extends Component {
  static propTypes = {
    isEditing: PropTypes.bool,
    offsetScrollCol: PropTypes.func.isRequired
  }

  state = {
    isEditing: this.props.isEditing,
    edited: false,
    data: this.props.data,
    originalData: this.props.data
  }

  /**
   * The component may receive data from a save event or
   * editing can be changed by a change in the activeCell in the TimetableGrid
   */
  componentWillReceiveProps (nextProps) {
    if (this.props.data !== nextProps.data) {
      this.setState({data: nextProps.data})
    }
    if (this.state.isEditing !== nextProps.isEditing) {
      this.setState({isEditing: nextProps.isEditing})
    }
  }

  cancel = () => {
    this.setState({
      isEditing: false,
      isFocused: false,
      data: this.props.data
    })
    this.props.onStopEditing()
  }

  beginEditing () {
    this.setState({isEditing: true})
  }

  handleClick = (evt) => {
    const {columnIndex, isFocused, onClick, rowIndex} = this.props
    if (isFocused) {
      // console.log(rowIndex, columnIndex)
      this.beginEditing()
    } else {
      // console.log(rowIndex, columnIndex)
      onClick(rowIndex, columnIndex)
    }
  }

  /**
   * Depending on the key pressed while focused on a cell, do some special things.
   */
  handleKeyDown = (evt) => {
    const input = ReactDOM.findDOMNode(this.cellInput)
    const {
      duplicateLeft,
      isFocused,
      onRight,
      onRowSelect,
      onUp,
      renderTime,
      offsetScrollCol
    } = this.props
    const {isEditing} = this.state
    switch (evt.keyCode) {
      case 88: // x
        if (renderTime) {
          evt.preventDefault()
          onRowSelect(evt)
          break
        } else {
          return true
        }
      case 79: // o
        if (renderTime) {
          evt.preventDefault()
          onRowSelect(evt)
          break
        } else {
          return true
        }
      case 222: // single quote
        if (evt.shiftKey) {
          console.log('dupe left')
          duplicateLeft && duplicateLeft(evt)
          onRight(evt)
          return false
        }
        break
      case 13: // Enter
        evt.preventDefault()
        if (isFocused) {
          this.beginEditing()
        }
        // handle shift
        if (evt.shiftKey) {
          this.save(evt)
          onUp(evt)
        } else {
          this.save(evt)
        }
        break
      case 9: // Tab
        // save and advance to next cell if editing
        this.save()
        offsetScrollCol(evt.shiftKey ? -1 : 1)
        evt.preventDefault()
        evt.stopPropagation()
        break
      case 27: // Esc
        this.cancel()
        break
      case 39: // right
        // cancel event propogation if cell is being edited
        if (isEditing) {
          evt.stopPropagation()
          return
        }

        // update scroll position in TimetableGrid
        offsetScrollCol(1)

        // save and move to next cell if at end of string
        if (input.selectionStart === input.value.length) {
          this.save(evt)
          return false
        } else {
          return true
        }
      case 37: // left
        // do nothing if cell is being edited
        if (isEditing) {
          evt.stopPropagation()
          return
        }

        // update scroll position in TimetableGrid
        offsetScrollCol(-1)

        // save and move to next cell if at start of string
        if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
          this.save(evt)
          return false
        } else {
          return true
        }
      case 38: // up
        this.save(evt)
        break
      case 40: // down
        this.save(evt)
        break
      default:
        return true
    }
  }

  _createRef = (input) => {
    this.cellInput = input
    // focus on cell input when input is rendered
    this.cellInput && ReactDOM.findDOMNode(this.cellInput).focus()
  }

  _onOuterKeyDown = (e) => {
    const {offsetScrollCol} = this.props
    switch (e.keyCode) {
      case 9:  // tab
        // update scroll position in TimetableGrid
        offsetScrollCol(e.shiftKey ? -1 : 1)
        // prevent other listeners and default browser tabbing
        e.stopPropagation()
        e.preventDefault()
        break
      case 37: // left
        // update scroll position in TimetableGrid
        offsetScrollCol(-1)
        break
      case 39: // right
        // update scroll position in TimetableGrid
        offsetScrollCol(1)
        break
    }
  }

  save () {
    // for non-time rendering
    if (!this.props.renderTime) {
      if (this.state.data !== this.state.originalData) {
        this.setState({isEditing: false})
        this.props.onChange(this.state.data, this.props.rowIndex, this.props.column, this.props.columnIndex)
        this.props.onStopEditing()
      } else {
        this.cancel()
      }
    } else {
      // for time rendering
      let data = this.state.data
      // console.log(this.state.data)
      if (typeof data !== 'string') return this.cancel()
      let hours, parts
      if (data.indexOf(':') > -1) {
        // is a string with colons
        parts = data.split(':')
        hours = +parts[0]
      } else {
        // is a string without colons
        if (data.length === 3) {
          // format of `hmm`
          parts = [data[0], data.substr(1, 3)]
          hours = +data[0]
        } else if (data.length === 4) {
          // format of `HHmm`
          parts = [data.substr(0, 2), data.substr(2, 4)]
          hours = +data.substr(0, 2)
        }
      }

      let greaterThan24 = false

      // check for times greater than 24:00
      // TODO: fix edge case of a stop time being 34 hours or more
      // realistically this probably wouldn't happen, but a hypothetical
      // case for this would be an airline flight that leaves at 23:59
      // and flies for 13 hours before landing.  Another use-case is the
      // trans-siberian railway that takes 7 days to travel from Moscow to Beijings
      if (parts && parts[0] && hours >= 24 && hours < 34) {
        parts[0] = `0${hours - 24}`
        greaterThan24 = true
        data = parts.join(':')
      }
      const date = moment().startOf('day').format('YYYY-MM-DD')
      const momentTime = moment(date + 'T' + data, TIMETABLE_FORMATS, true)
      let value = momentTime.isValid() ? momentTime.diff(date, 'seconds') : null

      if (greaterThan24 && momentTime.isValid()) {
        value += 86400
      }
      // check for valid time and new value
      if ((data === '' || momentTime.isValid()) && value !== data) {
        this.setState({data: value, isEditing: false})
        this.props.onChange(value, this.props.rowIndex, this.props.column, this.props.columnIndex)
        this.props.onStopEditing()
      } else {
        this.cancel()
      }
    }
  }

  cellRenderer (value) {
    if (this.props.cellRenderer) {
      return this.props.cellRenderer(this.props.column, value)
    } else {
      return value
    }
  }

  handleChange = (evt) => {
    this.setState({data: evt.target.value})
  }

  handlePaste = (evt) => {
    const text = evt.clipboardData.getData('Text')
    const rowDelimiter = text.indexOf('\n') > -1 // google sheets row delimiter
      ? '\n'
      : text.indexOf(String.fromCharCode(13)) > -1 // excel row delimiter
      ? String.fromCharCode(13)
      : null
    const rows = text.split(rowDelimiter)

    for (var i = 0; i < rows.length; i++) {
      rows[i] = rows[i].split(String.fromCharCode(9))
    }

    if (rows.length > 1 || rows[0].length > 1) {
      this.cancel()
      this.props.handlePastedRows(rows, this.props.rowIndex, this.props.columnIndex)
      evt.preventDefault()
    }
  }

  _onInputFocus = (evt) => {
    evt.target.select()
  }

  render () {
    // console.log(this.props)
    const rowCheckedColor = '#F3FAF6'
    const focusedNotEditing = this.props.isFocused && !this.state.isEditing
    const edgeDiff = this.props.isFocused ? 0 : 0.5
    const divStyle = {
      paddingTop: `${3 + edgeDiff}px`,
      paddingLeft: `${3 + edgeDiff}px`,
      fontWeight: this.state.edited ? 'bold' : 'normal'
    }
    const cellStyle = {
      backgroundColor: this.props.invalidData && !this.state.isEditing
        ? 'pink'
        : focusedNotEditing
        ? '#F4F4F4'
        : this.state.isEditing
        ? '#fff'
        : this.props.isSelected
        ? rowCheckedColor
        : '#fff',
      border: this.props.invalidData && focusedNotEditing
        ? '2px solid red'
        : this.props.isFocused
        ? `2px solid #66AFA2`
        : '1px solid #ddd',
      margin: `${-0.5 + edgeDiff}px`,
      padding: `${-edgeDiff}px`,
      // fontFamily: '"Courier New", Courier, monospace',
      color: this.props.lightText ? '#aaa' : '#000',
      ...this.props.style
    }
    const cellHtml = this.state.isEditing
      ? <input
        defaultValue={this.cellRenderer(this.state.data)}
        className='cell-input'
        onBlur={this.cancel}
        onChange={this.handleChange}
        onFocus={this._onInputFocus}
        onKeyDown={this.handleKeyDown}
        onPaste={this.handlePaste}
        placeholder={this.props.placeholder || ''}
        readOnly={!this.state.isEditing}
        ref={this._createRef}
        type='text' />
      : <div
        className='cell-div noselect'
        style={divStyle}
        >
        {this.cellRenderer(this.state.data)}
      </div>
    return (
      <div
        className='editable-cell small'
        role='button'
        style={cellStyle}
        tabIndex={0}
        onClick={this.handleClick}
        onKeyDown={this._onOuterKeyDown}>
        {cellHtml}
      </div>
    )
  }
}
