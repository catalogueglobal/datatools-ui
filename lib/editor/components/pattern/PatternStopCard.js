// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { DragSource, DropTarget } from 'react-dnd'
import { Row, Col, Collapse, FormGroup, ControlLabel, Checkbox } from 'react-bootstrap'

import {updateActiveGtfsEntity} from '../../actions/active'
import {getEntityName, getAbbreviatedStopName} from '../../util/gtfs'
import MinuteSecondInput from '../MinuteSecondInput'
import type {Feed, GtfsStop, Pattern, PatternStop} from '../../../types'

import PatternStopButtons from './PatternStopButtons'

type Props = {
  active: boolean,
  activePattern: Pattern,
  addStopToPattern: () => void,
  connectDragSource: any => void,
  // connectDropTarget: any => void,
  cumulativeTravelTime: number,
  feedSource: Feed,
  findCard: string => any,
  id: string,
  index: number,
  isDragging: boolean,
  moveCard: (string, number) => void,
  patternEdited: boolean,
  patternStop: PatternStop,
  removeStopFromPattern: (Pattern, GtfsStop, number) => void,
  rowStyle: {[string]: number | string},
  saveActiveEntity: string => void,
  setActiveEntity: () => void,
  setActiveStop: ({id: ?any, index: ?number}) => void,
  status: any,
  stop: any,
  stopIsActive: boolean,
  updateActiveGtfsEntity: typeof updateActiveGtfsEntity,
  updatePatternStops: (Pattern, Array<PatternStop>) => void
}

const cardSource = {
  beginDrag (props: Props) {
    return {
      id: props.id,
      originalIndex: props.findCard(props.id).index
    }
  },

  endDrag (props: Props, monitor: any) {
    const { id: droppedId, originalIndex } = monitor.getItem()
    const didDrop = monitor.didDrop()
    if (!didDrop) {
      console.log('endDrag')
      props.moveCard(droppedId, originalIndex)
    }
  },

  // disable dragging if request is pending (i.e., save trip pattern is in progress)
  canDrag (props: Props, monitor: any) {
    if (props.status.savePending || props.active) {
      const item = monitor.getItem()
      // Ensure item exists before getting ID.
      const id = item && item.id
      console.warn(`Cannot drag card (id=${id}). Card is active or save is in progress.`)
      return false
    }
    return true
  }
}

const cardTarget = {
  drop (props, monitor) {
    const { id: droppedId, originalIndex } = monitor.getItem()
    const { index: droppedIndex } = props.findCard(droppedId)
    if (droppedIndex !== originalIndex) {
      props.dropCard()
    }
  },

  hover (props, monitor) {
    const { id: draggedId } = monitor.getItem()
    const { id: overId } = props
    if (draggedId !== overId) {
      const { index: overIndex } = props.findCard(overId)
      props.moveCard(draggedId, overIndex)
    }
  }
}

class PatternStopCard extends Component<Props> {
  _formatTravelTime (cumulativeTravelTime, patternStop) {
    return `${Math.round(cumulativeTravelTime / 60)} (+${Math.round(patternStop.defaultTravelTime / 60)}${patternStop.defaultDwellTime > 0 ? ` +${Math.round(patternStop.defaultDwellTime / 60)}` : ''})`
  }

  handleClick = () => {
    const {active, id, index, setActiveStop} = this.props
    if (!active) setActiveStop({id, index})
    else setActiveStop({id: null, index: null})
  }

  _onKeyDown = (e) => {
    if (e.keyCode === 13) {
      this.handleClick()
    }
  }

  render () {
    const {
      active,
      connectDragSource,
      // $FlowFixMe https://github.com/flow-typed/flow-typed/issues/1564
      connectDropTarget,
      stop,
      index,
      patternStop,
      cumulativeTravelTime
    } = this.props
    const stopName = getEntityName(stop)
    const abbreviatedStopName = getAbbreviatedStopName(stop)
    const titleStopName = stop
      ? `${index + 1}. ${stopName}`
      : `${index + 1}. [unknown stop]`
    const fullStopName = stop
      ? `${index + 1}. ${abbreviatedStopName}`
      : `${index + 1}. [unknown stop]`
    return connectDragSource(connectDropTarget(
      <div className='pattern-stop-card'>
        {/* Main card title */}
        <div
          className='small'
          role='button'
          style={{cursor: 'pointer'}}
          tabIndex={0}
          onClick={this.handleClick}
          onKeyDown={this._onKeyDown}>
          <div className='pull-left'>
            <p
              style={{margin: '0px'}}
              title={titleStopName}>
              <Icon type={active ? 'caret-down' : 'caret-right'} />
              {fullStopName.length > 25
                ? fullStopName.substr(0, 25) + '...'
                : fullStopName
              }
            </p>
          </div>
          <div className='pull-right'>
            <p style={{margin: '0px'}} className='text-right'>
              <span>
                {this._formatTravelTime(cumulativeTravelTime, patternStop)}
              </span>
              {'    '}
              <span style={{cursor: '-webkit-grab', color: 'black'}} >
                <Icon type='bars' />
              </span>
            </p>
          </div>
          <div className='clearfix' />
        </div>
        <PatternStopContents {...this.props} />
      </div>
    ))
  }
}

type State = {
  initialDwellTime: number,
  initialTravelTime: number,
  update: boolean
}

class PatternStopContents extends Component<Props, State> {
  state = {
    initialDwellTime: this.props.patternStop.defaultDwellTime,
    initialTravelTime: this.props.patternStop.defaultTravelTime,
    update: false
  }

  componentWillReceiveProps (nextProps) {
    if (!nextProps.patternEdited && this.props.patternEdited) {
      this.setState({update: false})
    }
  }

  /**
   * Only update component if id changes, active state changes, or if pattern has
   * been saved (patternEdited changes to false). This is to ensure that default
   * times are not overwritten.
   * FIXME: id shouldn't change anymore (not generated client-side). Check that
   * this has no negative effects (check elsewhere, too, for example, pattern geom).
   */
  shouldComponentUpdate (nextProps, nextState) {
    if (nextProps.active !== this.props.active ||
      nextProps.id !== this.props.id ||
      nextState !== this.state ||
      (!nextProps.patternEdited && this.props.patternEdited)
    ) {
      return true
    }
    return false
  }

  _onChangeTimepoint = () => {
    const {activePattern, index, patternStop, saveActiveEntity, updatePatternStops} = this.props
    const patternStops = [...activePattern.patternStops]
    const newValue = patternStop.timepoint ? 0 : 1
    patternStops[index].timepoint = newValue
    updatePatternStops(activePattern, patternStops)
    saveActiveEntity('trippattern')
  }

  _onClickRemovePatternStop = () => {
    const {activePattern, index, saveActiveEntity, updatePatternStops} = this.props
    const patternStops = [...activePattern.patternStops]
    patternStops.splice(index, 1)
    updatePatternStops(activePattern, patternStops)
    saveActiveEntity('trippattern')
  }

  _onDwellTimeChange = (defaultDwellTime: number) => {
    const {activePattern, index, updatePatternStops} = this.props
    const patternStops = [...activePattern.patternStops]
    patternStops[index].defaultDwellTime = defaultDwellTime
    this.setState({update: true})
    updatePatternStops(activePattern, patternStops)
  }

  _onTravelTimeChange = (defaultTravelTime: number) => {
    const {activePattern, index, updatePatternStops} = this.props
    const patternStops = [...activePattern.patternStops]
    patternStops[index].defaultTravelTime = defaultTravelTime
    this.setState({update: true})
    updatePatternStops(activePattern, patternStops)
  }

  render () {
    const {active, patternEdited, patternStop} = this.props
    // This component has a special shouldComponentUpdate to ensure that state
    // is not overwritten with new props, so use state.update to check edited
    // state.
    const isEdited = patternEdited || this.state.update
    let innerDiv
    if (active) {
      innerDiv = <div>
        {/* Remove from pattern button */}
        <Row>
          <Col xs={4}>
            <Checkbox
              checked={patternStop.timepoint}
              onChange={this._onChangeTimepoint}>
              Timepoint?
            </Checkbox>
          </Col>
          <Col xs={8}>
            <PatternStopButtons
              {...this.props}
              patternEdited={isEdited}
              size='xsmall'
              style={{marginTop: '10px'}} />
          </Col>
        </Row>
        {/* default travel time inputs */}
        <Row>
          <Col xs={6}>
            <FormGroup
              controlId='defaultTravelTime'
              bsSize='small'>
              <ControlLabel className='small'>Default travel time</ControlLabel>
              <MinuteSecondInput
                seconds={this.state.initialTravelTime}
                onChange={this._onTravelTimeChange} />
            </FormGroup>
          </Col>
          <Col xs={6}>
            <FormGroup
              controlId='defaultDwellTime'
              bsSize='small'>
              <ControlLabel className='small'>Default dwell time</ControlLabel>
              <MinuteSecondInput
                seconds={this.state.initialDwellTime}
                onChange={this._onDwellTimeChange} />
            </FormGroup>
          </Col>
        </Row>
      </div>
    }
    return (
      <Collapse // collapsible div
        in={active}>
        <div>{innerDiv}</div>
      </Collapse>
    )
  }
}

const dropTargetCollect = (connect) => ({connectDropTarget: connect.dropTarget()})
const dragSourceCollect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
})

export default DropTarget('card', cardTarget, dropTargetCollect)(
  DragSource('card', cardSource, dragSourceCollect)(PatternStopCard)
)
