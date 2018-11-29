// @flow

import Icon from '@conveyal/woonerf/components/icon'
import Pure from '@conveyal/woonerf/components/pure'
import React, { Component } from 'react'
import {
  Alert,
  Button,
  Col,
  ListGroup,
  ListGroupItem,
  Row
} from 'react-bootstrap'
import Select from 'react-select'

import ActiveDateTimeFilter from '../containers/ActiveDateTimeFilter'
import Loading from '../../../../common/components/Loading'
import type {FetchStatus} from '../../../../types'
import type {AllRoutesSubState} from '../../../../types/reducers'
import type {PatternRowData} from '../../../selectors'

import TripsPerHourChart from './TripsPerHourChart'

type Props = {
  fetchStatus: FetchStatus,
  onComponentMount: (Props) => void,
  patternData: Array<PatternRowData>,
  patternDateTimeFilterChange: () => void,
  routeFilter: ?string,
  routeFilterChange: (string) => void,
  routes: AllRoutesSubState,
  version: any,
  viewStops: (?string) => void,
  viewTrips: (?string) => void
}

export default class PatternLayout extends Component<Props> {
  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  render () {
    const {
      fetchStatus: {
        error,
        fetched,
        fetching
      },
      patternData,
      patternDateTimeFilterChange,
      routeFilter,
      routeFilterChange,
      routes,
      version,
      viewStops,
      viewTrips
    } = this.props

    const maxTripsPerHourAllPatterns = fetched
      ? patternData.reduce(
        (accumulator, currentPattern) => {
          return Math.max(accumulator, ...currentPattern.tripsPerHour)
        },
        0
      )
      : 0

    return (
      <div>
        {routes.fetchStatus.fetched &&
          <div>
            <Row>
              <Col xs={12} md={6}>
                <label htmlFor='route_name'>Route:</label>
                <Select
                  id='route_name'
                  options={routes.data}
                  labelKey={'route_name'}
                  valueKey={'route_id'}
                  placeholder={'Select a Route'}
                  value={routeFilter}
                  onChange={routeFilterChange} />
              </Col>
            </Row>
            <ActiveDateTimeFilter
              hideDateTimeField
              onChange={patternDateTimeFilterChange}
              version={version} />
          </div>
        }

        {fetching &&
          <Loading />
        }

        {error &&
          <Alert bsStyle='danger'>
            An error occurred while trying to fetch the data
          </Alert>
        }

        {fetched &&
          <Row style={{marginTop: 20}}>
            <Col xs={12}>
              <ListGroup className='route-list'>
                {patternData.length > 0
                  ? patternData.map((pattern, index) => (
                    <PatternRow
                      key={index}
                      {...pattern}
                      index={index}
                      maxTripsPerHourAllPatterns={maxTripsPerHourAllPatterns}
                      viewStops={viewStops}
                      viewTrips={viewTrips} />
                  ))
                  : <Alert bsStyle='warning'><Icon type='exclamation-circle' /> Route has no patterns.</Alert>
                }
              </ListGroup>
            </Col>
          </Row>
        }
      </div>
    )
  }
}

class PatternRow extends Pure {
  props: PatternRowData & {
    index: number,
    maxTripsPerHourAllPatterns: number,
    viewStops: (?string) => void,
    viewTrips: (?string) => void
  }

  _onStopsClick = () => {
    this.props.viewStops(this.props.patternId)
  }

  _onTripsClick = () => {
    this.props.viewTrips(this.props.patternId)
  }

  render () {
    const {
      index,
      maxTripsPerHourAllPatterns,
      numStops,
      numTrips,
      patternName,
      tripsPerHour
    } = this.props

    const rowStyle = index % 2 === 0 ? {} : {backgroundColor: '#f7f7f7'}

    return (
      <ListGroupItem style={rowStyle}>
        <Row>
          <Col xs={12}>
            <Button
              bsStyle='link'
              style={{padding: 0, marginBottom: '10px', color: 'black'}}
              onClick={this._onTripsClick}><h5>{patternName}</h5></Button>
          </Col>
          <Col xs={12} md={6}>
            <TripsPerHourChart
              maxTripsPerHour={maxTripsPerHourAllPatterns}
              tripsPerHour={tripsPerHour} />
          </Col>
          <Col xs={12} md={3} style={{textAlign: 'center'}}>
            <Button onClick={this._onStopsClick}>
              <h5>{numStops} Stops</h5>
            </Button>
          </Col>
          <Col xs={12} md={3} style={{textAlign: 'center'}}>
            <Button onClick={this._onTripsClick}>
              <h5>{numTrips} Trips</h5>
            </Button>
          </Col>
        </Row>
      </ListGroupItem>
    )
  }
}
