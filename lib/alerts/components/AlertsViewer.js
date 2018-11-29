// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Button, Grid, Row, Col } from 'react-bootstrap'

import ManagerPage from '../../common/components/ManagerPage'
import CreateAlert from '../components/CreateAlert'
import VisibleAlertsList from '../containers/VisibleAlertsList'
import GlobalGtfsFilter from '../../gtfs/containers/GlobalGtfsFilter'
import GtfsMapSearch from '../../gtfs/components/gtfsmapsearch'
import type {Feed, GtfsRoute, GtfsStop, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  activeFeeds: Array<Feed>,
  createAlert: () => void,
  fetchAlerts: () => void,
  fetched: boolean,
  isFetching: boolean,
  onComponentMount: Props => void,
  onRouteClick: (GtfsRoute, Feed, ?number) => void,
  onStopClick: (GtfsStop, any, ?number) => void,
  project: Project,
  user: ManagerUserState
}

export default class AlertsViewer extends Component<Props> {
  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  _onClickRefresh = () => this.props.fetchAlerts()

  render () {
    const {
      activeFeeds,
      createAlert,
      fetched,
      isFetching,
      onStopClick,
      onRouteClick,
      project,
      user
    } = this.props

    // disable alert creation if user does not have permission or if still
    // fetching alerts (to prevent funky ui behavior)
    const createDisabled = project && user.permissions
      ? !user.permissions.hasProjectPermission(
        project.organizationId,
        project.id,
        'edit-alert'
      )
      : true
    return (
      <ManagerPage
        ref='page'
        title='Alerts'
      >
        <Grid fluid>
          <Row>
            <Col xs={6}>
              <h2>
                <Button
                  className='pull-right'
                  disabled={isFetching}
                  onClick={this._onClickRefresh}>
                  <Icon type='refresh' className={isFetching ? 'fa-spin' : ''} />
                </Button>
                <Icon type='exclamation-circle' /> Service Alerts
              </h2>
            </Col>
            <Col xs={6}>
              <h2>
                <CreateAlert
                  disabled={createDisabled}
                  fetched={fetched}
                  createAlert={createAlert} />
              </h2>
            </Col>
          </Row>
          <Row>
            <Col xs={12} sm={6}>
              <VisibleAlertsList />
            </Col>
            <Col xs={12} sm={6}>
              <Row>
                <Col xs={12}>
                  <GlobalGtfsFilter
                    permissionFilter='edit-alert' />
                </Col>
              </Row>
              <GtfsMapSearch
                feeds={activeFeeds}
                onStopClick={onStopClick}
                onRouteClick={onRouteClick}
                popupAction='Create Alert for' />
            </Col>
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}
