// @flow

import React, { Component } from 'react'
import moment from 'moment'
import intersection from 'lodash/intersection'

import Loading from '../../../common/components/Loading'
import toSentenceCase from '../../../common/util/to-sentence-case'
import {getChartMax, getChartPeriod} from '../../util'
import type {ValidationResult} from '../../../types'

type Props = {
  validationResult: ValidationResult
}

const maxDaysToShow = 500

export default class ServicePerModeChart extends Component<Props> {
  _getData = (validationResult: ValidationResult) => {
    const {dailyBusSeconds, dailyTramSeconds, dailyMetroSeconds, dailyRailSeconds, dailyTotalSeconds, firstCalendarDate} = validationResult
    const firstDate = moment(firstCalendarDate)
    const hasBus = dailyBusSeconds.filter(s => s > 0).length > 0
    const hasTram = dailyTramSeconds.filter(s => s > 0).length > 0
    const hasMetro = dailyMetroSeconds.filter(s => s > 0).length > 0
    const hasRail = dailyRailSeconds.filter(s => s > 0).length > 0
    let hasOther = false
    const data = []
    const limit = Math.min(dailyTotalSeconds.length, maxDaysToShow)
    for (let i = 0; i < limit; i++) {
      const column = {}
      column.date = firstDate.clone().add(i, 'days')
      let other = dailyTotalSeconds[i]
      column.total = this._secondsToHours(dailyTotalSeconds[i]) // total
      if (hasBus) {
        column.bus = this._secondsToHours(dailyBusSeconds[i]) // bus
        other -= dailyBusSeconds[i]
      }
      if (hasMetro) {
        column.metro = this._secondsToHours(dailyMetroSeconds[i]) // metro
        other -= dailyMetroSeconds[i]
      }
      if (hasRail) {
        column.rail = this._secondsToHours(dailyRailSeconds[i]) // rail
        other -= dailyRailSeconds[i]
      }
      if (hasTram) {
        column.tram = this._secondsToHours(dailyTramSeconds[i]) // tram
        other -= dailyTramSeconds[i]
      }
      if (other || hasOther) {
        column.other = this._secondsToHours(other)
        hasOther = true
      }
      data.push(column)
    }
    return data
  }

  _secondsToHours = (seconds: number) => Math.floor(seconds / 60 / 60 * 100) / 100

  render () {
    const {validationResult} = this.props
    if (!validationResult || !validationResult.dailyTripCounts) {
      return <Loading />
    }
    const data = this._getData(validationResult)
    if (data.length === 0) return <p>No service found</p>
    // Get list of modes found in GTFS
    const modes = intersection(
      ['other', 'metro', 'rail', 'tram', 'bus'],
      Object.keys(data[0])
    )
    const graphHeight = 300
    const spacing = 8
    const leftMargin = 50
    const rightMargin = 50
    const bottomMargin = 75
    const svgWidth = leftMargin + rightMargin + (data.length * spacing)
    const svgHeight = graphHeight + bottomMargin
    const maxHours = Math.max.apply(Math, data.map(d => d.total))
    const yAxisMax = getChartMax(maxHours)
    const yAxisPeriod = getChartPeriod(maxHours)
    const yAxisLabels = []
    const colors = ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6']
    const yScaleFactor = graphHeight / yAxisMax
    for (let i = yAxisPeriod; i <= yAxisMax; i += yAxisPeriod) {
      yAxisLabels.push(i)
    }
    const curtailed = maxDaysToShow < validationResult.dailyTotalSeconds.length
    return (
      <div
        className='text-center'
        style={{
          width: '100%',
          height: `${svgHeight}px`,
          overflowX: 'scroll',
          overflowY: 'hidden',
          border: '#ddd'
        }}>
        <svg
          style={{
            width: svgWidth,
            height: `${svgHeight}px`,
            paddingTop: '5px'
          }}>
          {yAxisLabels.map((l, index) => {
            const y = graphHeight - l * yScaleFactor
            return <g key={index}>
              <line
                x1={0} y1={y}
                x2={svgWidth} y2={y}
                stroke='gray'
                strokeWidth={1}
              />
              <text x={0} y={y - 2} fill='gray'>
                {l}
              </text>
            </g>
          })}
          {data.map((d, index) => {
            let previousKey = 'total'
            let previousY = graphHeight - d[previousKey] * yScaleFactor
            const dateString = d.date.format('YYYY-MM-DD')
            const x = leftMargin + (spacing / 2) + (index * spacing)
            // generate the stacked bar for this date
            return (
              <g key={index}>
                {modes.map((k, i) => {
                  const top = previousY
                  const bottom = previousY + d[k] * yScaleFactor
                  const g = d[k]
                    ? <g key={i}>
                      <title>{dateString}: {d[k]} {k} hours</title>
                      <line
                        x1={x} y1={top}
                        x2={x} y2={bottom}
                        stroke={colors[i]}
                        strokeWidth={7} />
                    </g>
                    : null
                  previousKey = k
                  previousY = bottom
                  return g
                })}
                {/* label x-axis with dates every 14 days */}
                {index % 14 === 0
                  ? <g>
                    <line x1={x} y1={graphHeight} x2={x} y2={graphHeight + 12} stroke='black' />
                    <text x={x - 35} y={graphHeight + 26} fill='black'>
                      {dateString}
                    </text>
                  </g>
                  : null
                }
              </g>
            )
          })}
          {/* Add baseline to chart */}
          <line
            x1={0}
            y1={graphHeight}
            x2={svgWidth}
            y2={graphHeight}
            stroke='black'
            strokeWidth={2} />
          {/* Add legend for bar colors */}
          {modes.reverse().map((mode, i) => (
            <g key={mode}>
              <rect
                x={100 * i - 5}
                y={graphHeight + 30}
                width='80'
                height='18'
                fill={colors[modes.length - i - 1]} />
              <text x={100 * i} y={graphHeight + 43} fill='black'>
                {toSentenceCase(mode)}
              </text>
            </g>
          ))}
          {curtailed &&
            <text x={100 * modes.length} y={graphHeight + 43}>
              * only first 500 days of service shown
            </text>
          }
        </svg>
      </div>
    )
  }
}
