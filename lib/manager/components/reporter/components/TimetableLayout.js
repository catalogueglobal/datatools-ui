// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Alert, Checkbox, Col, Row } from 'react-bootstrap'
import Select from 'react-select'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'

import Loading from '../../../../common/components/Loading'
import ActiveDateTimeFilter from '../containers/ActiveDateTimeFilter'
import type {
  AllRoutesSubState,
  PatternsState,
  TimetablesState
} from '../../../../types/reducers'

type Props = {
  filter: {
    patternFilter: ?string,
    routeFilter: ?string,
    showArrivals: boolean,
    timepointFilter: boolean
  },
  onComponentMount: (Props) => void,
  patternFilterChange: any => void,
  patterns: PatternsState,
  routeFilterChange: (?string) => void,
  routes: AllRoutesSubState,
  showArrivalsToggle: () => void,
  tableOptions: any,
  timepointFilterToggle: () => void,
  timetableDateTimeFilterChange: () => void,
  timetableTableData: {
    columns: Array<any>,
    rows: Array<any>
  },
  timetables: TimetablesState,
  version: any
}

export default class TimetableLayout extends Component<Props> {
  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  render () {
    const {
      filter,
      patternFilterChange,
      patterns,
      routeFilterChange,
      routes,
      showArrivalsToggle,
      tableOptions,
      timepointFilterToggle,
      timetableDateTimeFilterChange,
      timetableTableData,
      timetables,
      version
    } = this.props
    const {
      patternFilter,
      routeFilter,
      showArrivals,
      timepointFilter
    } = filter

    const allFiltersSelected = routeFilter && patternFilter
    return (
      <div>
        <Row style={{ marginBottom: '20px' }}>
          <Col xs={12} md={6}>
            <label htmlFor='route_name'>Route:</label>
            <Select
              options={routes.data || []}
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
                options={patterns.data.patterns}
                labelKey={'name'}
                valueKey={'pattern_id'}
                placeholder={'Select a Pattern'}
                value={patternFilter}
                onChange={patternFilterChange} />
            </Col>
          }
        </Row>
        <ActiveDateTimeFilter
          onChange={timetableDateTimeFilterChange}
          version={version} />
        <Row style={{ margin: '20px 0' }}>
          <Col xs={12} md={6}>
            <Checkbox
              checked={timepointFilter}
              onChange={timepointFilterToggle}>
              Only show stops with times
            </Checkbox>
          </Col>
          <Col xs={12} md={6}>
            <Checkbox
              checked={!showArrivals}
              onChange={showArrivalsToggle}>
              Compressed view (hide dwell times)
            </Checkbox>
          </Col>
          <ul style={{fontSize: 'x-small', marginLeft: '15px'}} className='list-unstyled'>
            <li><span style={{minWidth: '40px', color: 'green'}}>HH:MM:SS</span> Travel time to stop <strong>faster</strong> than usual</li>
            <li><span style={{minWidth: '40px', color: 'red'}}>HH:MM:SS</span> Travel time to stop <strong>slower</strong> than usual</li>
            <li><span style={{color: 'red'}}><Icon type='caret-up' /></span> Headway (time since previous vehicle) <strong>increased</strong> over usual</li>
            <li><span style={{color: 'green'}}><Icon type='caret-down' /></span> Headway (time since previous vehicle) <strong>decreased</strong> over usual</li>
          </ul>
        </Row>
        {timetables.fetchStatus.fetching &&
          <Loading />
        }
        {timetables.fetchStatus.error &&
          <Alert bsStyle='danger'>
            An error occurred while trying to fetch the data
          </Alert>
        }
        {!allFiltersSelected &&
          <Alert>
            Select a route and a pattern
          </Alert>
        }
        {allFiltersSelected && timetables.fetchStatus.fetched && timetableTableData.rows.length > 0 &&
          <BootstrapTable
            {...tableOptions}
            headerStyle={{fontSize: 'small', textWrap: 'normal', wordWrap: 'break-word', whiteSpace: 'no-wrap'}}
            bodyStyle={{fontSize: 'small'}}
            data={timetableTableData.rows}>
            {timetableTableData.columns.map((col, index) => {
              const {name, ...props} = col
              return (
                <TableHeaderColumn {...props} key={index} />
              )
            })}
          </BootstrapTable>
        }
        {allFiltersSelected && timetables.fetchStatus.fetched && timetableTableData.rows.length === 0 &&
          <Alert bsStyle='warning'>
            No trips were found for the selected route, pattern, date, from time and to time.
          </Alert>
        }
      </div>
    )
  }
}
