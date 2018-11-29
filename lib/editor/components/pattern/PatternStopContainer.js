// @flow

import React, {Component} from 'react'
import update from 'react/lib/update'
import { shallowEqual } from 'react-pure-render'
import { DropTarget, DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

import {updateActiveGtfsEntity} from '../../actions/active'
import type {GtfsStop, Feed, Pattern, PatternStop} from '../../../types'

import PatternStopCard from './PatternStopCard'

type Props = {
  activePattern: Pattern,
  addStopToPattern: any,
  feedSource: Feed,
  patternEdited: boolean,
  patternStop: {id: ?any, index: ?number},
  removeStopFromPattern: any,
  saveActiveEntity: any,
  setActiveEntity: any,
  setActiveStop: any,
  status: any,
  stops: Array<GtfsStop>,
  updateActiveGtfsEntity: typeof updateActiveGtfsEntity,
  updatePatternStops: any
}

type State = {
  cards: Array<PatternStop>
}

const cardTarget = {
  drop () {}
}

/**
 * This component and its child components (Card.js) are based on the react-dnd
 * sortable example found here: http://gaearon.github.io/react-dnd/examples-sortable-cancel-on-drop-outside.html
 */
class PatternStopContainer extends Component<Props, State> {
  state = {
    cards: this.props.activePattern.patternStops
  }

  componentWillReceiveProps (nextProps) {
    // Updates cards when pattern stops order changes (does not account for changes to default travel/dwell times)
    if (nextProps.activePattern.patternStops && !shallowEqual(nextProps.activePattern.patternStops, this.props.activePattern.patternStops)) {
      this.setState({cards: nextProps.activePattern.patternStops})
    }
  }

  /**
   * Triggered when a dragged card is dropped finally dropped into a resting
   * place. This updates the pattern stops based on the current cards state.
   */
  dropCard = () => {
    const {
      activePattern,
      saveActiveEntity,
      updatePatternStops
    } = this.props
    // FIXME: Move around control points based on pattern stop reorder? Simply
    // changing the stop IDs is not sufficient (the shape dist traveled probably)
    // out to change too. However, this may not be necessary.
    // let stopIndex = 0
    // updatePatternGeometry({
    //   // Reverse control points
    //   controlPoints: clone(controlPoints).map((cp, i) => {
    //     if (cp.pointType === POINT_TYPE.STOP) {
    //       // Update stopId based on new pattern stop order
    //       cp.stopId = patternStops[stopIndex++].stopId
    //     }
    //     return cp
    //   }),
    //   // Reverse order of segments and each segment's coordinate list.
    //   patternSegments
    // })
    // Update pattern stops with cloned copy of cards. NOTE: stop resequencing
    // is handled by updatePatternStops.
    updatePatternStops(activePattern, [...this.state.cards])
    saveActiveEntity('trippattern')
  }

  moveCard = (id, atIndex) => {
    const {card, index} = this.findCard(id)
    this.setState(update(this.state, {
      cards: {
        $splice: [
          [index, 1],
          [atIndex, 0, card]
        ]
      }
    }))
  }

  findCard = (id) => {
    const { cards } = this.state
    const card = cards.filter((c, i) => c.id === id)[0]
    return {
      card,
      index: cards.indexOf(card)
    }
  }

  render () {
    const {
      activePattern,
      // $FlowFixMe
      connectDropTarget,
      patternStop,
      saveActiveEntity,
      feedSource,
      patternEdited,
      setActiveStop,
      status,
      stops,
      updateActiveGtfsEntity,
      updatePatternStops,
      addStopToPattern,
      removeStopFromPattern,
      setActiveEntity
    } = this.props
    const { cards } = this.state
    if (!stops) return null
    const stopNotFound = activePattern.patternStops.findIndex(ps => ps.id === patternStop.id) === -1

    let cumulativeTravelTime = 0
    return connectDropTarget(
      <div>
        {cards.map((card, i) => {
          if (!card) {
            return null
          }
          const stop = stops && stops.find(st => st.stop_id === card.stopId)
          cumulativeTravelTime += card.defaultDwellTime + card.defaultTravelTime
          return (
            // $FlowFixMe
            <PatternStopCard
              key={card.id}
              id={card.id}
              index={i}
              cumulativeTravelTime={cumulativeTravelTime}
              stop={stop}
              status={status}
              feedSource={feedSource}
              activePattern={activePattern}
              patternEdited={patternEdited}
              updateActiveGtfsEntity={updateActiveGtfsEntity}
              updatePatternStops={updatePatternStops}
              saveActiveEntity={saveActiveEntity}
              addStopToPattern={addStopToPattern}
              removeStopFromPattern={removeStopFromPattern}
              setActiveEntity={setActiveEntity}
              patternStop={card}
              moveCard={this.moveCard}
              findCard={this.findCard}
              dropCard={this.dropCard}
              active={patternStop.id === card.id || (stopNotFound && patternStop.index === i)} // fallback to index if/when id changes
              setActiveStop={setActiveStop} />
          )
        })}
      </div>
    )
  }
}

const dropTargetCollect = (connect) => ({connectDropTarget: connect.dropTarget()})

export default DragDropContext(HTML5Backend)(DropTarget('card', cardTarget, dropTargetCollect)(PatternStopContainer))
