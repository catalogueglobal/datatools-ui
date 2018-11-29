// @flow

import Pure from '@conveyal/woonerf/components/pure'
import React, { Component } from 'react'
import {
  Alert,
  Button,
  Col,
  ListGroup,
  ListGroupItem,
  Pagination,
  Row
} from 'react-bootstrap'
import Select from 'react-select'

import Loading from '../../../../common/components/Loading'
import ActiveDateTimeFilter from '../containers/ActiveDateTimeFilter'
import type {RouteRowData} from '../../../selectors'
import type {FetchStatus} from '../../../../types'
import type {AllRoutesSubState, RouteListItem} from '../../../../types/reducers'

import TripsPerHourChart from './TripsPerHourChart'

type Props = {
  allRoutes: AllRoutesSubState,
  fetchStatus: FetchStatus,
  numRoutes: number,
  onComponentMount: (boolean) => void,
  routeData: Array<RouteRowData>,
  routeDateTimeFilterChange: () => void,
  routeOffset: number,
  routeOffsetChange: (number) => void,
  tableOptions: any,
  version: any,
  viewPatterns: (?string) => void,
  viewStops: (?string) => void,
  viewTrips: (?string) => void
}

const PAGE_SIZE = 10

export default class RouteLayout extends Component<Props> {
  componentWillMount () {
    this.props.onComponentMount(this.props.fetchStatus.fetched)
  }

  _onPaginationSelect = (value: number) => {
    this.props.routeOffsetChange((value - 1) * PAGE_SIZE)
  }

  _onSelectRoute = (route: RouteListItem & {index: number}) => this.props.routeOffsetChange(route.index)

  render () {
    const {
      allRoutes,
      fetchStatus: {
        error,
        fetching,
        fetched
      },
      numRoutes,
      routeData,
      routeDateTimeFilterChange,
      routeOffset,
      version,
      viewPatterns,
      viewStops,
      viewTrips
    } = this.props

    const maxTripsPerHourAllRoutes = fetched ? routeData.reduce(
      (accumulator, currentRoute) => {
        return Math.max(accumulator, ...currentRoute.tripsPerHour)
      },
      0
    ) : 0
    // If route offset is out of sync with page size, add an extra page (e.g.,
    // if offset = 5, make active page 2, so that previous page is clickable in
    // order to see items 1 - 4).
    const extraPage = +(routeOffset % PAGE_SIZE > 0)
    const activePage = Math.floor(routeOffset / PAGE_SIZE) + 1 + extraPage

    return (
      <div>
        {allRoutes !== null && allRoutes.data !== null && <Row>
          <Col xs={12} md={6}>
            <label htmlFor='route_name'>Route:</label>
            <Select
              id='route_name'
              options={allRoutes.data.map((r, index) => ({...r, index}))}
              labelKey={'route_name'}
              valueKey={'route_id'}
              placeholder={'Jump to a Route'}
              // value={routeFilter}
              onChange={this._onSelectRoute} />
          </Col>
        </Row>}
        <ActiveDateTimeFilter
          hideDateTimeField
          onChange={routeDateTimeFilterChange}
          version={version} />

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
                {routeData.map((route, index) => (
                  <RouteRow
                    key={index}
                    {...route}
                    index={index}
                    maxTripsPerHourAllRoutes={maxTripsPerHourAllRoutes}
                    viewPatterns={viewPatterns}
                    viewStops={viewStops}
                    viewTrips={viewTrips} />
                ))}
              </ListGroup>
              <Pagination
                activePage={activePage}
                bsSize='large'
                ellipsis
                first
                items={Math.ceil(numRoutes / PAGE_SIZE)}
                last
                next
                onSelect={this._onPaginationSelect}
                prev />
            </Col>
          </Row>
        }
      </div>
    )
  }
}

class RouteRow extends Pure {
  props: RouteRowData & {
    index: number,
    maxTripsPerHourAllRoutes: number,
    viewPatterns: (?string) => void,
    viewStops: (?string) => void,
    viewTrips: (?string) => void
  }

  _onStopsClick = () => {
    this.props.viewStops(this.props.routeId)
  }

  _onTripsClick = () => {
    this.props.viewTrips(this.props.routeId)
  }

  _onPatternsClick = () => {
    this.props.viewPatterns(this.props.routeId)
  }

  render () {
    const {
      index,
      maxTripsPerHourAllRoutes,
      numPatterns,
      numStops,
      numTrips,
      routeName,
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
              onClick={this._onPatternsClick}><h5>{routeName}</h5></Button>
          </Col>
          <Col xs={12} md={6}>
            <TripsPerHourChart
              maxTripsPerHour={maxTripsPerHourAllRoutes}
              tripsPerHour={tripsPerHour} />
          </Col>
          <Col xs={12} md={2} style={{textAlign: 'center'}}>
            <Button onClick={this._onStopsClick}>
              <h5>{numStops} Stops</h5>
            </Button>
          </Col>
          <Col xs={12} md={2} style={{textAlign: 'center'}}>
            <Button onClick={this._onTripsClick}>
              <h5>{numTrips} Trips</h5>
            </Button>
          </Col>
          <Col xs={12} md={2} style={{textAlign: 'center'}}>
            <Button onClick={this._onPatternsClick}>
              <h5>{numPatterns} Patterns</h5>
            </Button>
          </Col>
        </Row>
      </ListGroupItem>
    )
  }
}
