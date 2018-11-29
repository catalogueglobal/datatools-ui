// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Grid, Row, Col, Button, Panel, ListGroup, ListGroupItem, ControlLabel} from 'react-bootstrap'
import {Link} from 'react-router'
import {LinkContainer} from 'react-router-bootstrap'

import ManagerPage from '../../common/components/ManagerPage'
import {getComponentMessages, getConfigProperty} from '../../common/util/config'
import auth0 from '../../common/user/Auth0Manager'
import type {Subscription} from '../../common/user/UserSubscriptions'
import type {UserProfile, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  activeComponent: string,
  projectId: string,
  projects: Array<Project>,
  unsubscribeAll: ?UserProfile => void,
  updateUserSubscription: (?UserProfile, string, string) => void,
  user: ManagerUserState
}

export default class UserAccount extends Component<Props> {
  messages = getComponentMessages('UserAccount')

  _onClickUnsubscribeAll = () => this.props.unsubscribeAll(this.props.user.profile)

  _onResetPassword = () => auth0.resetPassword()

  render () {
    const {activeComponent, projectId, projects, user} = this.props
    const {profile} = user
    if (!profile) return console.warn('User profile not found', user)
    const subscriptions: Array<Subscription> = profile.app_metadata.datatools
      .find(dt => dt.client_id === process.env.AUTH0_CLIENT_ID).subscriptions
    const ACCOUNT_SECTIONS = [
      {
        id: 'profile',
        component: (
          <div>
            <Panel header={<h4>Profile information</h4>}>
              <ListGroup fill>
                <ListGroupItem>
                  <ControlLabel>Email address</ControlLabel>
                  <div>{profile.email}</div>
                </ListGroupItem>
                <ListGroupItem>
                  <p><strong>Avatar</strong></p>
                  <a href='http://gravatar.com'>
                    <img
                      alt='Profile'
                      className='img-rounded'
                      height={40}
                      width={40}
                      src={profile.picture} />
                    <span style={{marginLeft: '10px'}}>Change on gravatar.com</span>
                  </a>
                </ListGroupItem>
                <ListGroupItem>
                  <p><strong>Password</strong></p>
                  <Button
                    onClick={this._onResetPassword}>
                    Change password
                  </Button>
                </ListGroupItem>
              </ListGroup>
            </Panel>
          </div>
        )
      },
      {
        id: 'account',
        hidden: !getConfigProperty('modules.enterprise.enabled'),
        component: null
      },
      {
        id: 'organizations',
        hidden: !getConfigProperty('modules.enterprise.enabled'),
        component: null
      },
      {
        id: 'notifications',
        hidden: !getConfigProperty('application.notifications_enabled'),
        component: (
          <div>
            {/* TODO: implement this on back-end
            <Panel header={<h4>Notification methods</h4>}>
              <ListGroup fill>
                <ListGroupItem>
                  <h4>Watching</h4>
                  <p>Receive updates to any feed sources or comments you are watching.</p>
                  <Checkbox inline>Email</Checkbox>{' '}<Checkbox inline>Web</Checkbox>
                </ListGroupItem>
              </ListGroup>
            </Panel> */}
            <Panel
              header={
                <h4>
                  <Button
                    onClick={this._onClickUnsubscribeAll}
                    className='pull-right'
                    bsStyle='info'
                    bsSize='xsmall'
                  >
                    <Icon type='eye-slash' />
                    {' '}
                    {this.messages('notifications.unsubscribeAll')}
                  </Button>
                  {this.messages('notifications.subscriptions')}
                </h4>
              }>
              {subscriptions && subscriptions.length
                ? <SubscriptionsManager
                  subscriptions={subscriptions}
                  {...this.props} />
                : <li>No subscriptions.</li>
              }
            </Panel>
          </div>
        )
      },
      {
        id: 'billing',
        hidden: !getConfigProperty('modules.enterprise.enabled'),
        component: null
      }
    ]
    const activeSection = ACCOUNT_SECTIONS.find(section => section.id === activeComponent)
    const visibleComponent = activeSection ? activeSection.component : null
    return (
      <ManagerPage ref='page'>
        <Grid fluid>
          <Row style={{marginBottom: '20px'}}>
            <Col xs={12}>
              <h1>
                <LinkContainer className='pull-right' to={{ pathname: '/home' }}>
                  <Button>Back to dashboard</Button>
                </LinkContainer>
                <Icon type='user' /> My settings
              </h1>
            </Col>
          </Row>
          <Row>
            <Col xs={3}>
              <Panel header={<h4>{this.messages('personalSettings')}</h4>}>
                <ListGroup fill>
                  {ACCOUNT_SECTIONS.map(section => {
                    if (section.hidden) return null
                    return (
                      <LinkContainer key={section.id} to={`/settings/${section.id}`}>
                        <ListGroupItem active={activeComponent === section.id}>
                          {this.messages(`${section.id}.title`)}
                        </ListGroupItem>
                      </LinkContainer>
                    )
                  })}
                </ListGroup>
              </Panel>
              <Panel header={<h4>{this.messages('organizationSettings')}</h4>}>
                <ListGroup fill>
                  {projects && projects.map(project => {
                    return (
                      <LinkContainer key={project.id} to={`/project/${project.id}/settings`}>
                        <ListGroupItem active={projectId === project.id}>
                          {project.name}
                        </ListGroupItem>
                      </LinkContainer>
                    )
                  })}
                </ListGroup>
              </Panel>
            </Col>
            <Col xs={1} />
            <Col xs={6}>
              {visibleComponent}
            </Col>
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}

class SubscriptionsManager extends Component<Props & {subscriptions: Array<Subscription>}> {
  render () {
    const {subscriptions} = this.props

    const projectSubscriptions = subscriptions.find(sub => sub.type === 'project-updated')
    const feedSubscriptions = subscriptions.find(sub => sub.type === 'feed-updated')
    const deploymentSubscriptions = subscriptions.find(sub => sub.type === 'deployment-updated')
    return <div>
      {projectSubscriptions && (
        <div>
          <h4><Icon type='eye' /> Watched Projects</h4>
          {projectSubscriptions.target.length
            ? (
              <ListGroup>
                {projectSubscriptions.target.map((target, k) =>
                  <WatchedProject key={k} target={target} {...this.props} />
                )}
              </ListGroup>
            )
            : <span>No projects currently being watched</span>
          }
        </div>
      )}
      {feedSubscriptions && (
        <div style={{ marginTop: 30 }}>
          <h4><Icon type='eye' /> Watched Feeds</h4>
          {feedSubscriptions.target.length
            ? (
              <ListGroup>
                {feedSubscriptions.target.map((target, k) =>
                  <WatchedFeed key={k} target={target} {...this.props} />
                )}
              </ListGroup>
            )
            : <span>No feeds currently being watched</span>
          }
        </div>
      )}
      {deploymentSubscriptions && (
        <div style={{ marginTop: 30 }}>
          <h4><Icon type='eye' /> Watched Deployments</h4>
          {deploymentSubscriptions.target.length
            ? (
              <ListGroup>
                {deploymentSubscriptions.target.map((target, k) =>
                  <WatchedDeployment key={k} target={target} {...this.props} />
                )}
              </ListGroup>
            )
            : <span>No deployments currently being watched</span>
          }
        </div>
      )}
    </div>
  }
}

class WatchedProject extends Component<Props & {target: string}> {
  _onClickRemoveSubscriptionTarget = () => {
    const {target, updateUserSubscription, user} = this.props
    updateUserSubscription(user.profile, target, 'project-updated')
  }

  render () {
    const {projects, target} = this.props
    const project = projects && projects.find(p => p.id === target)
    const projectLink = project
      ? <span><Icon type='folder-open' /> <Link to={`/project/${project.id}`}>{project.name}</Link></span>
      : <span style={{ fontStyle: 'italic', color: 'gray' }}>{target} (Deleted)</span>
    return (
      <ListGroupItem>
        {projectLink}
        <Button bsSize='xsmall' bsStyle='info'
          className='pull-right'
          onClick={this._onClickRemoveSubscriptionTarget}
        ><Icon type='eye-slash' /> Unwatch</Button>
      </ListGroupItem>
    )
  }
}

class WatchedFeed extends Component<Props & {target: string}> {
  _onClickRemoveSubscriptionTarget = () => {
    const {target, updateUserSubscription, user} = this.props
    updateUserSubscription(user.profile, target, 'feed-updated')
  }

  render () {
    const {projects, target} = this.props
    // Find the FeedSource and Project, if present
    let feedSource, project
    if (projects) {
      for (var i = 0; i < projects.length; i++) {
        const p = projects[i]
        if (p.feedSources) {
          const fs = p.feedSources.find(fs => fs.id === target)
          if (fs) {
            feedSource = fs
            project = p
            break
          }
        }
      }
    }

    const fsLink = feedSource && project
      ? <span>
        <Icon type='folder-open' /> <Link to={`/project/${project.id}`}>{project.name}</Link>
        {' / '}
        <Icon type='bus' /> <Link to={`/feed/${feedSource.id}`}>{feedSource.name}</Link>
      </span>
      : <span style={{ fontStyle: 'italic', color: 'gray' }}>{target} (Deleted)</span>
    return (
      <ListGroupItem>
        {fsLink}
        <Button bsSize='xsmall' bsStyle='info'
          className='pull-right'
          onClick={this._onClickRemoveSubscriptionTarget}
        ><Icon type='eye-slash' /> Unwatch</Button>
      </ListGroupItem>
    )
  }
}

class WatchedDeployment extends Component<Props & {target: string}> {
  _onClickRemoveSubscriptionTarget = () => {
    const {target, updateUserSubscription, user} = this.props
    updateUserSubscription(user.profile, target, 'deployment-updated')
  }

  render () {
    const {projects, target} = this.props
    // Find the FeedSource and Project, if present
    let deployment, project
    if (projects) {
      for (var i = 0; i < projects.length; i++) {
        const p = projects[i]
        if (!p.deployments) continue
        const dp = p.deployments.find(dp => dp.id === target)
        if (dp) {
          deployment = dp
          project = p
          break
        }
      }
    }
    const deploymentLink = deployment && project
      ? <span>
        <Icon type='folder-open' />{' '}
        <Link to={`/project/${project.id}`}>{project.name}</Link>
        {' / '}
        <Icon type='globe' />{' '}
        <Link to={`/project/${project.id}/deployments/${deployment.id}`}>
          {deployment.name}
        </Link>
      </span>
      : <span style={{ fontStyle: 'italic', color: 'gray' }}>
        {target} (Deleted)
      </span>
    return (
      <ListGroupItem>
        {deploymentLink}
        <Button bsSize='xsmall' bsStyle='info'
          className='pull-right'
          onClick={this._onClickRemoveSubscriptionTarget}
        ><Icon type='eye-slash' /> Unwatch</Button>
      </ListGroupItem>
    )
  }
}
