// @flow

import React, { Component } from 'react'
import { Row, Col, Alert } from 'react-bootstrap'
import Select from 'react-select'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'

// import { formatHeadway } from '../../../../gtfs/util/stats'
import Loading from '../../../../common/components/Loading'
import ActiveDateTimeFilter from '../containers/ActiveDateTimeFilter'

import type {Pattern, Stop} from '../../../../gtfs/reducers/patterns'
import type {AllRoutes, Route} from '../../../../gtfs/reducers/routes'

export type Props = {
  dateTimeFilterChange: (any) => void,
  onComponentMount: (Props) => void,
  patternFilter: ?string,
  patternFilterChange: (?Pattern) => void,
  patterns: Array<Pattern>,
  routeFilter: ?string,
  routeFilterChange: (?Route) => void,
  routes: {
    fetchStatus: {
      error: boolean,
      fetched: boolean,
      fetching: boolean
    },
    data: null | AllRoutes
  },
  stops: Array<Stop>,
  tableOptions: any,
  version: any
}

export default class StopLayout extends Component<Props> {
  componentWillMount () {
    this.props.onComponentMount(this.props)
  }
  render () {
    const {
      dateTimeFilterChange,
      patternFilter,
      patternFilterChange,
      patterns,
      routeFilter,
      routeFilterChange,
      routes,
      stops,
      tableOptions,
      version
    } = this.props

    return (
      <div>
        <Row style={{ marginBottom: '20px' }}>
          <Col xs={12} md={6}>
            <label htmlFor='route_name'>Route:</label>
            <Select
              options={routes.data}
              labelKey={'route_name'}
              valueKey={'route_id'}
              placeholder={'Select a Route'}
              value={routeFilter}
              onChange={routeFilterChange} />
          </Col>
          {routeFilter &&
            <Col xs={12} md={6}>
              <label htmlFor='pattern'>Pattern:</label>
              <Select
                options={patterns}
                labelKey={'name'}
                valueKey={'pattern_id'}
                placeholder={'Select a Pattern'}
                value={patternFilter}
                onChange={patternFilterChange} />
            </Col>
          }
        </Row>
        <ActiveDateTimeFilter
          hideDateTimeField
          onChange={dateTimeFilterChange}
          version={version}
          />
        {routes.fetchStatus.fetching &&
          <Loading />
        }
        {routes.fetchStatus.error &&
          <Alert bsStyle='danger'>
            An error occurred while trying to fetch the data
          </Alert>
        }
        {routes.fetchStatus.fetched &&
          <Row style={{marginTop: 20}}>
            <Col xs={12}>
              <BootstrapTable
                data={stops}
                {...tableOptions}>
                <TableHeaderColumn dataSort dataField='stop_id' isKey width='100px'>ID</TableHeaderColumn>
                <TableHeaderColumn dataSort dataField='stop_name' width='50%'>Name</TableHeaderColumn>
                <TableHeaderColumn dataSort dataField='stop_code'>Stop Code</TableHeaderColumn>
                <TableHeaderColumn dataSort dataField='zone_id'>Zone ID</TableHeaderColumn>
              </BootstrapTable>
            </Col>
          </Row>
        }
      </div>
    )
  }
}
