// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import DateTimeField from 'react-bootstrap-datetimepicker'
import update from 'react-addons-update'
import {shallowEqual} from 'react-pure-render'
import moment from 'moment'
import {
  Row,
  Col,
  Button,
  Panel,
  Glyphicon,
  Checkbox,
  FormGroup,
  InputGroup,
  ControlLabel,
  FormControl,
  ListGroup,
  ListGroupItem
} from 'react-bootstrap'

import {deleteProject} from '../actions/projects'
import ConfirmModal from '../../common/components/ConfirmModal'
import LanguageSelect from '../../common/components/LanguageSelect'
import MapModal from '../../common/components/MapModal'
import TimezoneSelect from '../../common/components/TimezoneSelect'
import {getComponentMessages} from '../../common/util/config'
import type {Project} from '../../types'

const DEFAULT_FETCH_TIME = moment().startOf('day').add(2, 'hours')

type Props = {
  deleteProject: typeof deleteProject,
  editDisabled: boolean,
  project: Project,
  updateProjectSettings: (Project, Object) => void
}

type State = {
  general: Object,
  name: string
}

export default class GeneralSettings extends Component<Props, State> {
  messages = getComponentMessages('GeneralSettings')
  state = {
    general: {},
    name: ''
  }

  componentWillReceiveProps (nextProps: Props) {
    this.setState({general: {}})
  }

  shouldComponentUpdate (nextProps: Props, nextState: State) {
    return !shallowEqual(nextProps, this.props) || !shallowEqual(nextState, this.state)
  }

  _onDeleteProject = () => {
    const {deleteProject, project} = this.props
    this.refs.confirm.open({
      title: this.messages('deleteProject'),
      body: this.messages('confirmDelete'),
      onConfirm: () => deleteProject(project)
    })
  }

  _onChangeAutoFetch = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const autoFetchMinute = DEFAULT_FETCH_TIME.minutes()
    const autoFetchHour = DEFAULT_FETCH_TIME.hours()
    const autoFetchFeeds = evt.target.checked
    this.setState(update(this.state, {general: {
      $merge: {autoFetchFeeds, autoFetchMinute, autoFetchHour}
    }}))
  }

  _onChangeBounds = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    // Parse values found in string into floats
    const bBox = evt.target.value.split(',')
      .map(parseFloat)
      // Filter out any bad parsed values
      .filter(parsedValue => !isNaN(parsedValue))
    if (bBox.length === 4) {
      // Update settings if and only if there are four valid parsed values
      const [west, south, east, north] = bBox
      const bounds = {west, south, east, north}
      this.setState(update(this.state, {general: {
        $merge: {bounds}
      }}))
    } else {
      console.warn('Invalid values for bounding box', bBox)
    }
  }

  _onChangeDateTime = (seconds: string) => {
    const time = moment(+seconds)
    this.setState(update(this.state, {general: {
      $merge: {autoFetchMinute: time.minutes(), autoFetchHour: time.hours()}
    }}))
  }

  _onChangeLocation = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const latLng = evt.target.value.split(',')
    if (typeof latLng[0] !== 'undefined' && typeof latLng[1] !== 'undefined') {
      const [defaultLocationLat, defaultLocationLon] = latLng
      this.setState(update(this.state, {general: {
        $merge: {defaultLocationLat, defaultLocationLon}
      }}))
    } else {
      console.warn('invalid value for latlng', latLng)
    }
  }

  _onChangeLanguage = (defaultLanguage: string) => {
    this.setState(update(this.state, {general: {$merge: {defaultLanguage}}}))
  }

  _onChangeTimeZone = ({value: defaultTimeZone}: {label: string, value: string}) => {
    this.setState(update(this.state, {general: {$merge: {defaultTimeZone}}}))
  }

  _onChangeValue = ({target}: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({[target.name]: target.value})
  }

  _onOpenMapBoundsModal = () => {
    const {bounds: boundsObj} = this.props.project
    const bounds = boundsObj
      ? [[boundsObj.south, boundsObj.west], [boundsObj.north, boundsObj.east]]
      : null
    this.refs.mapModal.open({
      title: 'Select project bounds',
      body: `Pretend this is a map`,
      bounds: bounds,
      rectangleSelect: true,
      onConfirm: (rectangle) => {
        if (rectangle && rectangle.getBounds()) {
          const [[south, west], [north, east]] = rectangle.getBounds()
            .map(arr => arr.map(v => v.toFixed(6)))
          const bounds = `${west},${south},${east},${north}`
          const node = ReactDOM.findDOMNode(this.refs.boundingBox)
          if (node) {
            // $FlowFixMe FIXME add comment that describes what is going on here
            node.value = bounds
          }
          this.setState(update(this.state, {general: {
            $merge: {west, south, east, north}
          }}))
        }
        return rectangle
      }
    })
  }

  _onOpenMapModal = () => {
    const {defaultLocationLat, defaultLocationLon} = this.props.project
    const bounds = defaultLocationLat !== null && defaultLocationLon !== null
      ? [
        [defaultLocationLat + 1, defaultLocationLon + 1],
        [defaultLocationLat - 1, defaultLocationLon - 1]
      ]
      : null
    this.refs.mapModal.open({
      title: 'Select a default location',
      body: `Pretend this is a map`,
      markerSelect: true,
      marker: defaultLocationLat && defaultLocationLon
        ? {lat: defaultLocationLat, lng: defaultLocationLon}
        : null,
      bounds: bounds,
      onConfirm: (marker) => {
        if (marker) {
          const defaultLocationLat = +marker.lat.toFixed(6)
          const defaultLocationLon = +marker.lng.toFixed(6)
          this.setState(update(this.state, {general: {
            $merge: {defaultLocationLat, defaultLocationLon}
          }}))
        }
      }
    })
  }

  _onSaveSettings = () => {
    this.props.updateProjectSettings(this.props.project, this.state.general)
  }

  _onUpdateName = () => {
    const {name} = this.state
    this.props.updateProjectSettings(this.props.project, {name})
    this.setState({name: undefined})
  }

  _settingsAreUnedited = () => Object.keys(this.state.general).length === 0 &&
    this.state.general.constructor === Object

  render () {
    const {project, editDisabled} = this.props
    const autoFetchChecked = typeof this.state.general.autoFetchFeeds !== 'undefined'
      ? this.state.general.autoFetchFeeds
      : project.autoFetchFeeds
    if (editDisabled) {
      return (
        <p className='lead text-center'>
          <strong>Warning!</strong>{' '}
          You do not have permission to edit details for this feed source.
        </p>
      )
    }
    return (
      <div className='general-settings-panel'>
        <ConfirmModal ref='confirm' />
        <Panel header={<h4>{this.messages('title')}</h4>}>
          <ListGroup fill>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel>
                  {this.messages('general.name')}
                </ControlLabel>
                <InputGroup>
                  <FormControl
                    value={typeof this.state.name !== 'undefined'
                      ? this.state.name
                      : project.name
                    }
                    name={'name'}
                    onChange={this._onChangeValue} />
                  <InputGroup.Button>
                    <Button
                      disabled={!this.state.name || this.state.name === project.name}
                      onClick={this._onUpdateName}>
                      {this.messages('rename')}
                    </Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Panel header={<h4>{this.messages('general.updates.title')}</h4>}>
          <ListGroup fill>
            <ListGroupItem>
              <FormGroup>
                <Checkbox
                  checked={autoFetchChecked}
                  onChange={this._onChangeAutoFetch}>
                  <strong>
                    {this.messages('general.updates.autoFetchFeeds')}
                  </strong>
                </Checkbox>
                {autoFetchChecked
                  ? <DateTimeField
                    dateTime={project.autoFetchMinute !== null
                      ? +moment().startOf('day')
                        .add(project.autoFetchHour, 'hours')
                        .add(project.autoFetchMinute, 'minutes')
                      : DEFAULT_FETCH_TIME
                    }
                    mode='time'
                    onChange={this._onChangeDateTime} />
                  : null
                }
              </FormGroup>
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Panel header={<h4>{this.messages('general.location.title')}</h4>}>
          <ListGroup fill>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel>
                  <Glyphicon glyph='map-marker' />{' '}
                  {this.messages('general.location.defaultLocation')}
                </ControlLabel>
                <InputGroup ref='defaultLocationGroup'>
                  <FormControl
                    type='text'
                    value={this.state.general.defaultLocationLat && this.state.general.defaultLocationLon
                      ? `${this.state.general.defaultLocationLat},${this.state.general.defaultLocationLon}`
                      : project.defaultLocationLat && project.defaultLocationLon
                        ? `${project.defaultLocationLat},${project.defaultLocationLon}`
                        : ''
                    }
                    ref='defaultLocation'
                    placeholder='34.8977,-87.29987'
                    onChange={this._onChangeLocation} />
                  <InputGroup.Button>
                    <Button
                      onClick={this._onOpenMapModal}>
                      <Glyphicon glyph='map-marker' />
                    </Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </ListGroupItem>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel>
                  <Glyphicon glyph='fullscreen' />{' '}
                  {this.messages('general.location.boundingBox')}
                </ControlLabel>
                <InputGroup ref='boundingBoxGroup'>
                  <FormControl
                    type='text'
                    defaultValue={project.bounds
                      ? `${project.bounds.west},${project.bounds.south},${project.bounds.east},${project.bounds.north}`
                      : ''
                    }
                    ref='boundingBox'
                    placeholder='-88.45,33.22,-87.12,34.89'
                    onChange={this._onChangeBounds} />
                  {
                    <InputGroup.Button>
                      <Button
                        // TODO: wait for react-leaflet-draw to update library
                        // to re-enable bounds select
                        disabled
                        onClick={this._onOpenMapBoundsModal}>
                        <Glyphicon glyph='fullscreen' />
                      </Button>
                    </InputGroup.Button>
                  }
                </InputGroup>
              </FormGroup>
            </ListGroupItem>
            <ListGroupItem>
              <ControlLabel>
                <Glyphicon glyph='time' />{' '}
                {this.messages('general.location.defaultTimeZone')}
              </ControlLabel>
              <TimezoneSelect
                value={this.state.general.defaultTimeZone || project.defaultTimeZone}
                onChange={this._onChangeTimeZone} />
            </ListGroupItem>
            <ListGroupItem>
              <ControlLabel>
                <Glyphicon glyph='globe' />{' '}
                {this.messages('general.location.defaultLanguage')}
              </ControlLabel>
              <LanguageSelect
                value={this.state.general.defaultLanguage || project.defaultLanguage}
                onChange={this._onChangeLanguage} />
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Panel bsStyle='danger' header={<h3>Danger zone</h3>}>
          <ListGroup fill>
            <ListGroupItem>
              <Button
                bsStyle='danger'
                className='pull-right'
                data-test-id='delete-project-button'
                onClick={this._onDeleteProject}
              >
                <Icon type='trash' /> Delete project
              </Button>
              <h4>Delete this project.</h4>
              <p>
                Once you delete a project, the project and all feed sources
                it contains cannot be recovered.
              </p>
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Row>
          <Col xs={12}>
            {/* Save button */}
            <Button
              bsStyle='primary'
              disabled={editDisabled || this._settingsAreUnedited()}
              onClick={this._onSaveSettings}>
              {this.messages('save')}
            </Button>
          </Col>
        </Row>
        <MapModal ref='mapModal' />
      </div>
    )
  }
}
