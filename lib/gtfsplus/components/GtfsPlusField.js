import React, {PropTypes, Component} from 'react'
import {FormControl} from 'react-bootstrap'

import EditableTextField from '../../common/components/EditableTextField'
import GtfsSearch from '../../gtfs/components/gtfssearch'

export default class GtfsPlusField extends Component {
  static propTypes = {
    currentValue: PropTypes.any,
    feedSource: PropTypes.object,
    field: PropTypes.object,
    fieldEdited: PropTypes.func,
    getGtfsEntity: PropTypes.func,
    gtfsEntitySelected: PropTypes.func,
    row: PropTypes.number,
    table: PropTypes.object
  }

  _onChangeRoute = ({route}) => {
    const {field, fieldEdited, gtfsEntitySelected, row: rowIndex, table} = this.props
    // tableId, rowIndex, fieldName, newValue
    fieldEdited({tableId: table.id, rowIndex, fieldName: field.name, newValue: route.route_id})
    gtfsEntitySelected('route', route)
  }

  _onChangeStop = ({stop}) => {
    const {field, fieldEdited, gtfsEntitySelected, row: rowIndex, table} = this.props
    fieldEdited({tableId: table.id, rowIndex, fieldName: field.name, newValue: stop.stop_id})
    gtfsEntitySelected('stop', stop)
  }

  _onChangeValue = (newValue) => {
    const {field, fieldEdited, row: rowIndex, table} = this.props
    fieldEdited({tableId: table.id, rowIndex, fieldName: field.name, newValue})
  }

  _onChange = ({target}) => {
    const {field, fieldEdited, row: rowIndex, table} = this.props
    fieldEdited({tableId: table.id, rowIndex, fieldName: field.name, newValue: target.value})
  }

  render () {
    const {currentValue, feedSource, field, getGtfsEntity} = this.props
    switch (field.inputType) {
      case 'TEXT':
      case 'GTFS_TRIP':
      case 'GTFS_FARE':
      case 'GTFS_SERVICE':
      case 'GTFS_ZONE':
        return (
          <EditableTextField
            value={currentValue}
            onChange={this._onChangeValue} />
        )
      case 'DROPDOWN':
        // NOTE: client has requested that GTFS+ fields be case insensitive (hence the toUpperCase call)
        const option = currentValue !== null && field.options.find(o => o.value.toUpperCase() === currentValue.toUpperCase())
        return (
          <FormControl componentClass='select'
            value={option ? option.value : ''}
            onChange={this._onChange}>
            {/* Add field for empty string value if that is not an allowable option so that user selection triggers onChange */}
            {field.options.findIndex(option => option.value === '') === -1
              ? <option disabled value=''>{field.required ? '-- select an option --' : '(optional)' }</option>
              : null
            }
            {field.options.map(option => {
              // NOTE: client has requested that GTFS+ fields be case insensitive (hence the toLowerCase call)
              return <option value={option.value} key={option.value}>
                {option.text || option.value}
              </option>
            })}
          </FormControl>
        )
      case 'GTFS_ROUTE':
        const routeEntity = getGtfsEntity('route', currentValue)

        const routeValue = routeEntity
          ? {
            'value': routeEntity.route_id,
            'label': routeEntity.route_short_name
              ? `${routeEntity.route_short_name} - ${routeEntity.route_long_name}`
              : routeEntity.route_long_name
          }
          : null

        return (
          <GtfsSearch
            feeds={[feedSource]}
            limit={100}
            entities={['routes']}
            minimumInput={1}
            clearable={false}
            onChange={this._onChangeRoute}
            value={routeValue} />
        )
      case 'GTFS_STOP':
        const stopEntity = getGtfsEntity('stop', currentValue)
        const stopValue = stopEntity
          ? {'value': stopEntity.stop_id, 'label': stopEntity.stop_name}
          : null
        return (
          <GtfsSearch
            feeds={[feedSource]}
            limit={100}
            entities={['stops']}
            clearable={false}
            minimumInput={1}
            onChange={this._onChangeStop}
            value={stopValue} />
        )
    }
  }
}
