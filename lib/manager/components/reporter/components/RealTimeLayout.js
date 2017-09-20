import React, { Component, PropTypes } from 'react'
// import { Alert, Button } from 'react-bootstrap'
import moment from 'moment'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'

// import Loading from '../../../../common/components/Loading'

export default class RealTimeLayout extends Component {
  static propTypes = {
    onComponentMount: PropTypes.func,
    onComponentUnmount: PropTypes.func,
    vehiclePositions: PropTypes.object,
    serviceAlerts: PropTypes.object,
    tripUpdates: PropTypes.object
  }

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  componentWillUnmount () {
    this.props.onComponentUnmount(this.props)
  }

  render () {
    const {routes, serviceAlerts, stops, trips, vehiclePositions, tripUpdates} = this.props
    return (
      <div>

        {serviceAlerts &&
          <p className='lead'>{serviceAlerts.entity.length} alerts! <small title={moment.unix(serviceAlerts.header.timestamp).format()}>last updated {moment.unix(serviceAlerts.header.timestamp).format('H:mma')}</small></p>
        }
        {tripUpdates &&
          <p className='lead'>{tripUpdates.entity.length} updates! <small title={moment.unix(tripUpdates.header.timestamp).format()}>last updated {moment.unix(tripUpdates.header.timestamp).format('H:mma')}</small></p>
        }
        {vehiclePositions &&
          <p className='lead'>{vehiclePositions.entity.length} positions! <small title={moment.unix(vehiclePositions.header.timestamp).format()}>last updated {moment.unix(vehiclePositions.header.timestamp).format('H:mma')}</small></p>
        }
        {vehiclePositions &&
          <BootstrapTable
            data={vehiclePositions.entity}
            {...this.props.tableOptions}
          >
            <TableHeaderColumn dataSort dataField='id' isKey>ID</TableHeaderColumn>
            <TableHeaderColumn dataSort dataField='trip.trip_id'>Trip ID</TableHeaderColumn>
            <TableHeaderColumn dataSort dataField='route_long_name'>Long Name</TableHeaderColumn>
          </BootstrapTable>
        }
      </div>
    )
  }
}
