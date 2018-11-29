// @flow

import React, {Component} from 'react'
import {Checkbox, FormControl, FormGroup, ControlLabel, Tooltip, OverlayTrigger} from 'react-bootstrap'
import Select from 'react-select'
import moment from 'moment'
import DateTimeField from 'react-bootstrap-datetimepicker'
import Dropzone from 'react-dropzone'

import {updateActiveGtfsEntity} from '../actions/active'
import {getEntityName, getTableById} from '../util/gtfs'
import {FIELD_PROPS} from '../util/types'
import {doesNotExist} from '../util/validation'
import TimezoneSelect from '../../common/components/TimezoneSelect'
import LanguageSelect from '../../common/components/LanguageSelect'
import toSentenceCase from '../../common/util/to-sentence-case'
import type {EditorTableData, Entity, Feed, Field, GtfsAgency, GtfsStop} from '../../types'

import ZoneSelect from './ZoneSelect'
import VirtualizedEntitySelect from './VirtualizedEntitySelect'
import ColorField from './ColorField'

type Props = {
  activeComponent: string,
  activeEntity: any, // TODO: should be type Entity, but was causing error
  approveGtfsDisabled: boolean,
  currentValue: any,
  feedSource: Feed,
  field: Field,
  hasRoutes: boolean,
  isNotValid: boolean,
  table: any,
  tableData: EditorTableData,
  updateActiveGtfsEntity: typeof updateActiveGtfsEntity,
  uploadBrandingAsset: (string, number, string, File) => void,
  zoneOptions: Array<any>
}

const agencyToOption = (agency: GtfsAgency) => ({
  value: agency.agency_id,
  label: agency.agency_name,
  agency
})

const entityToOption = (entity: ?Entity, key: string) => {
  return entity
    ? {
      value: entity[key],
      label: getEntityName(entity),
      entity
    }
    : null
}

export default class EditorInput extends Component<Props> {
  _onColorChange = (color: any) => {
    const {updateActiveGtfsEntity, activeEntity, activeComponent, field} = this.props
    updateActiveGtfsEntity({
      component: activeComponent,
      entity: activeEntity,
      props: {[field.name]: color.hex.split('#')[1]}
    })
  }

  _onDateChange = (millis: number) => {
    const {updateActiveGtfsEntity, activeEntity, activeComponent, field} = this.props
    updateActiveGtfsEntity({
      component: activeComponent,
      entity: activeEntity,
      props: {[field.name]: moment(+millis).format('YYYYMMDD')}
    })
  }

  _onDowChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const {updateActiveGtfsEntity, activeEntity, activeComponent, field} = this.props
    updateActiveGtfsEntity({
      component: activeComponent,
      entity: activeEntity,
      props: {[field.name]: evt.target.checked ? 1 : 0}
    })
  }

  _onInputChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const {updateActiveGtfsEntity, activeEntity, activeComponent, field} = this.props
    updateActiveGtfsEntity({
      component: activeComponent,
      entity: activeEntity,
      props: {[field.name]: evt.target.value}
    })
  }

  _onSelectChange = (option: any) => {
    const {updateActiveGtfsEntity, activeEntity, activeComponent, field} = this.props
    updateActiveGtfsEntity({
      component: activeComponent,
      entity: activeEntity,
      props: {[field.name]: option ? option.value : null}
    })
  }

  _uploadBranding = (files: Array<File>) => {
    const {uploadBrandingAsset, feedSource, activeEntity, activeComponent} = this.props
    uploadBrandingAsset(feedSource.id, activeEntity.id, activeComponent, files[0])
  }

  render () {
    const {
      activeEntity,
      activeComponent,
      tableData,
      field,
      currentValue,
      approveGtfsDisabled,
      zoneOptions,
      isNotValid
    } = this.props
    const editorField = field.displayName || field.name
    const formProps = {}
    formProps.controlId = `${editorField}`
    formProps.className = `col-xs-${field.columnWidth}`
    if (isNotValid) {
      formProps.validationState = 'error'
    } else if (field.required) {
      formProps.validationState = 'success'
    }
    const fieldType = FIELD_PROPS.find(f => f.inputType === field.inputType) || {}
    const value = !doesNotExist(currentValue)
      ? currentValue
      : undefined
    const fieldProps = {
      value,
      placeholder: field.placeholder || '',
      onChange: this._onInputChange,
      ...fieldType.props
    }
    const basicLabel = field.helpContent
      ? <OverlayTrigger
        placement='right'
        overlay={<Tooltip id='tooltip'>{field.helpContent}</Tooltip>}>
        <ControlLabel>
          <small>{editorField}{field.required ? ' *' : ''}</small>
        </ControlLabel>
      </OverlayTrigger>
      : <ControlLabel>
        <small>{editorField}{field.required ? ' *' : ''}</small>
      </ControlLabel>
    switch (field.inputType) {
      case 'GTFS_ID':
      case 'TEXT':
      case 'TIME':
      case 'GTFS_TRIP':
      case 'EMAIL':
      case 'GTFS_SHAPE':
      case 'LATITUDE':
      case 'LONGITUDE':
      case 'NUMBER':
      case 'POSITIVE_INT':
      case 'POSITIVE_NUM':
      case 'GTFS_BLOCK':
      case 'GTFS_FARE':
      case 'GTFS_SERVICE': {
        // Ensure that an empty string is passed to value prop, so that on 'undo'
        // the input value will revert back to a blank field.
        const stringValue = typeof fieldProps.value === 'undefined'
          ? ''
          : fieldProps.value
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <FormControl {...fieldProps} value={stringValue} />
          </FormGroup>
        )
      }
      case 'URL': {
        // Ensure that an empty string is passed to value prop, so that on 'undo'
        // the input value will revert back to a blank field.
        const stringValue = typeof fieldProps.value === 'undefined'
          ? ''
          : fieldProps.value
        const elements = [
          <FormGroup {...formProps} key={`${editorField}-input`}>
            {basicLabel}
            <FormControl {...fieldProps} value={stringValue} />
          </FormGroup>
        ]
        if (field.name.indexOf('_branding_url') > -1) {
          const url: string = activeEntity && activeEntity[field.name]
          elements.push(
            <FormGroup
              className='col-xs-12'
              key={`${editorField}-upload`}>
              <ControlLabel>Upload {activeComponent} branding asset</ControlLabel>
              <Dropzone
                accept='image/*'
                multiple={false}
                onDrop={this._uploadBranding}>
                <div style={{marginBottom: '10px'}}>Drop {activeComponent} image here, or click to select image to upload.</div>
                {url
                  ? <img
                    alt={field.name}
                    className='img-responsive'
                    src={url} />
                  : null
                }
              </Dropzone>
            </FormGroup>
          )
        }
        return <span>{elements}</span>
      }
      case 'GTFS_ZONE':
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <ZoneSelect
              addCreateOption
              onChange={this._onSelectChange}
              value={currentValue}
              options={zoneOptions} />
          </FormGroup>
        )
      case 'TIMEZONE':
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <TimezoneSelect
              value={currentValue}
              clearable={!field.required}
              onChange={this._onSelectChange} />
          </FormGroup>
        )
      case 'LANGUAGE':
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <LanguageSelect
              value={currentValue}
              clearable={false}
              onChange={this._onSelectChange} />
          </FormGroup>
        )
      case 'DATE':
        const defaultValue = /end/.test(editorField)
          ? +moment().startOf('day').add(3, 'months')
          : +moment().startOf('day')
        const dateTimeProps = {}
        dateTimeProps.mode = 'date'
        dateTimeProps.dateTime = currentValue ? +moment(currentValue) : defaultValue
        dateTimeProps.onChange = this._onDateChange
        if (!currentValue) {
          dateTimeProps.defaultText = 'Please select a date'
        }
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <DateTimeField {...dateTimeProps} />
          </FormGroup>
        )
      case 'COLOR':
        return (
          <ColorField
            field={field}
            formProps={formProps}
            label={basicLabel}
            onChange={this._onColorChange}
            value={value} />
        )
      case 'DAY_OF_WEEK_BOOLEAN':
        return (
          <span>
            <span>
              {editorField === 'monday' // insert label for entire category on first checkbox
                ? <div className='col-xs-12'><ControlLabel>Days of service</ControlLabel></div>
                : null
              }
            </span>
            <span className='col-xs-3'>
              <Checkbox
                inline
                checked={currentValue === 1}
                onChange={this._onDowChange}>
                <small>{toSentenceCase(editorField.substr(0, 3))}</small>
              </Checkbox>
            </span>
          </span>
        )
      case 'DROPDOWN':
        return (
          <FormGroup
            {...formProps}
            className={field.columnWidth ? `col-xs-${field.columnWidth}` : 'col-xs-12'}>
            {basicLabel}
            <FormControl
              {...fieldProps}
              value={!doesNotExist(value) ? value : ''} // set value to '' to allow for selection of disabled option
              disabled={approveGtfsDisabled && field.adminOnly}>
              {/* Add field for empty string value if that is not an allowable option so that user selection triggers onChange */}
              {field.options && field.options.findIndex(option => option.value === '') === -1
                ? <option disabled value=''>{field.required ? '-- select an option --' : '(optional)' }</option>
                : null
              }
              {field.options && field.options.map(o => (<option value={o.value} key={o.value}>{o.text || o.value}</option>))}
            </FormControl>
          </FormGroup>
        )
      case 'GTFS_ROUTE': {
        const routes = getTableById(tableData, 'route')
        const key = 'route_id'
        const route = routes.find(s => s[key] === currentValue)
        return (
          <VirtualizedEntitySelect
            value={entityToOption(route, key)}
            component={'route'}
            entityKey={key}
            entities={routes}
            onChange={this._onSelectChange} />
        )
      }
      case 'GTFS_AGENCY':
        const agencies = getTableById(tableData, 'agency')
        const agency = agencies.find(a => a.agency_id === currentValue)
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <Select
              placeholder='Select agency...'
              clearable
              value={agency
                ? agencyToOption(agency)
                : currentValue !== null
                  // Still display agency_id value for route if not null
                  ? {value: currentValue}
                  : null
              }
              onChange={this._onSelectChange}
              options={agencies.map(agencyToOption)} />
          </FormGroup>
        )
      case 'GTFS_STOP': {
        // Create copy of stops table (because of destructive splice operation
        // below).
        const stops: Array<GtfsStop> = [...getTableById(tableData, 'stop')]
        const key = 'stop_id'
        const castedEntity = ((activeEntity: any): GtfsStop)
        const activeStopIndex = stops.findIndex(s => s[key] === castedEntity[key])
        const selectedStop = stops.find(s => s[key] === currentValue)
        // Remove current entity from list of stops because this is only used
        // for parent_station selection and we can't make the self the parent).
        if (activeStopIndex !== -1) {
          stops.splice(activeStopIndex, 1)
        }
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <VirtualizedEntitySelect
              value={entityToOption(selectedStop, key)}
              component={'stop'}
              entityKey={key}
              entities={stops}
              onChange={this._onSelectChange} />
          </FormGroup>
        )
      }
      default:
        return null
    }
  }
}
