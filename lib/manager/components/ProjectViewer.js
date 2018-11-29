// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {
  Tabs,
  Tab,
  Grid,
  Row,
  Col,
  Button,
  ListGroup,
  ListGroupItem,
  Glyphicon,
  ButtonToolbar,
  Panel
} from 'react-bootstrap'
import {browserHistory, Link} from 'react-router'
import {shallowEqual} from 'react-pure-render'

import {deleteProject, updateProject} from '../actions/projects'
import ManagerPage from '../../common/components/ManagerPage'
import WatchButton from '../../common/containers/WatchButton'
import {getComponentMessages, getConfigProperty, isModuleEnabled} from '../../common/util/config'
import {defaultSorter} from '../../common/util/util'
import type {Deployment, Feed, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import ProjectSettings from './ProjectSettings'
import ProjectViewerHeader from './ProjectViewerHeader'
import DeploymentsPanel from './DeploymentsPanel'
import FeedSourceTable from './FeedSourceTable'

type Props = {
  activeComponent: string,
  activeSubComponent: string,
  createDeployment: string => void,
  createDeploymentFromFeedSource: () => void,
  createFeedSource: string => void,
  deleteDeploymentConfirmed: Deployment => void,
  deleteFeedSource: () => void,
  deleteFeedSourceConfirmed: Feed => void,
  deleteProject: typeof deleteProject,
  deployPublic: Project => void,
  downloadMergedFeed: Project => void,
  fetchDeployments: () => void,
  fetchFeed: () => void,
  fetchProjectDeployments: string => void,
  isFetching: boolean,
  onComponentMount: Props => void,
  project: Project,
  projectId: string,
  saveDeployment: any => void,
  saveFeedSource: (any) => void,
  searchTextChanged: string => void,
  thirdPartySync: string => void,
  updateAllFeeds: Project => void,
  updateDeployment: (Deployment, any) => void,
  updateFeedSource: (Feed, any) => void,
  updateProject: typeof updateProject,
  uploadFeed: (Feed, File) => void,
  user: ManagerUserState,
  visibilityFilter: any,
  visibilityFilterChanged: string => void
}

type State = {}

export default class ProjectViewer extends Component<Props, State> {
  messages = getComponentMessages('ProjectViewer')
  state = {}

  deleteFeedSource (feedSource: Feed) {
    this.refs['page'].showConfirmModal({
      title: 'Delete Feed Source?',
      body: `Are you sure you want to delete the feed source ${feedSource.name}?`,
      onConfirm: () => this.props.deleteFeedSourceConfirmed(feedSource)
    })
  }

  _onClickNewFeedSource = () => this.props.createFeedSource(this.props.projectId)

  _fetchDeployments = () => this.props.fetchProjectDeployments(this.props.projectId)

  _selectTab = (key: string) => {
    const {deployments, id} = this.props.project
    if (key === 'sources') {
      browserHistory.push(`/project/${id}/`)
    } else {
      browserHistory.push(`/project/${id}/${key}`)
    }
    if (key === 'deployments' && !deployments) {
      this._fetchDeployments()
    }
  }

  shouldComponentUpdate (newProps: Props) {
    return !shallowEqual(newProps, this.props)
  }

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  _onClickDeploy = () => this.props.deployPublic(this.props.project)

  _onSelectFilter = (key: string) => this.props.visibilityFilterChanged(key)

  render () {
    const {
      activeComponent,
      activeSubComponent,
      isFetching,
      project,
      user,
      visibilityFilter
    } = this.props
    if (isFetching && !project) {
      // Show spinner if fetching (and there is no current feed source loaded).
      return (
        <ManagerPage ref='page'>
          <Grid fluid>
            <h1
              className='text-center'
              style={{marginTop: '150px'}}>
              <Icon className='fa-5x fa-spin' type='refresh' />
            </h1>
          </Grid>
        </ManagerPage>
      )
    }
    if (!project) {
      // If not fetching, but no project was found, show project not found view.
      return (
        <ManagerPage ref='page'>
          <Grid fluid>
            <Row>
              <Col xs={12}>
                <p className='project-not-found'>No project found for <strong>{this.props.projectId}</strong></p>
                <p><Link to='/project'>Return to list of projects</Link></p>
              </Col>
            </Row>
          </Grid>
        </ManagerPage>
      )
    }
    const s3Bucket = getConfigProperty('application.data.gtfs_s3_bucket')
    const publicFeedsLink = s3Bucket
      ? `https://s3.amazonaws.com/${s3Bucket}/public/index.html`
      : null
    const isWatchingProject = user.subscriptions && user.subscriptions.hasProjectSubscription(project.id, 'project-updated')
    const projectEditDisabled = !user.permissions || !user.permissions.isProjectAdmin(project.id, project.organizationId)
    const filteredFeedSources = project.feedSources
      ? project.feedSources.filter(feedSource => {
        if (feedSource.isCreating) return true // feeds actively being created are always visible
        const visible = feedSource.name !== null ? feedSource.name.toLowerCase().indexOf((visibilityFilter.searchText || '').toLowerCase()) !== -1 : '[unnamed project]'
        switch (visibilityFilter.filter) {
          case 'ALL':
            return visible
          case 'STARRED':
            return [].indexOf(feedSource.id) !== -1 // check userMetaData
          case 'PUBLIC':
            return feedSource.isPublic
          case 'PRIVATE':
            return !feedSource.isPublic
          default:
            return visible
        }
      }).sort(defaultSorter)
      : []
    return (
      <ManagerPage
        ref='page'
        title={project.name}>
        <Grid fluid>
          <Row
            style={{
              backgroundColor: '#F5F5F5',
              margin: '-40px',
              paddingTop: '40px',
              marginBottom: '-64px',
              paddingBottom: '60px',
              paddingRight: '20px',
              paddingLeft: '20px',
              borderBottom: '1px #e3e3e3 solid'
            }}>
            <Col xs={12}>
              <h3>
                <Icon className='icon-link' type='folder-open-o' /><Link to={`/project/${project.id}`}>{project.name}</Link>
                <ButtonToolbar className={`pull-right`}>
                  {getConfigProperty('application.notifications_enabled')
                    ? <WatchButton
                      isWatching={isWatchingProject}
                      user={user}
                      target={project.id}
                      subscriptionType='project-updated' />
                    : null
                  }
                </ButtonToolbar>
              </h3>
              <ul className='list-unstyled list-inline small' style={{marginBottom: '0px'}}>
                <li><Icon type='map-marker' /> {project.defaultLocationLon ? `${project.defaultLocationLat}, ${project.defaultLocationLon}` : 'n/a'}</li>
                <li><Icon type='cloud-download' /> {project.autoFetchFeeds ? `${project.autoFetchHour}:${project.autoFetchMinute < 10 ? '0' + project.autoFetchMinute : project.autoFetchMinute}` : 'Auto fetch disabled'}</li>
                {/* <li><Icon type='file-archive-o' /> {fs.feedVersions ? `${this.getAverageFileSize(fs.feedVersions)} MB` : 'n/a'}</li> */}
              </ul>
            </Col>
          </Row>
          <Tabs
            id='project-viewer-tabs'
            activeKey={activeComponent || 'sources'}
            onSelect={this._selectTab}>
            <Tab
              eventKey='sources'
              title={
                <span>
                  <Glyphicon className='icon-link' glyph='list' />
                  <span className='hidden-xs'>{this.messages('feeds.title')}</span>
                </span>
              }>
              <Row>
                <Col xs={12} sm={9}>
                  <Panel
                    header={
                      <ProjectViewerHeader
                        onNewFeedSourceClick={this._onClickNewFeedSource}
                        {...this.props} />
                    }>
                    <FeedSourceTable
                      fill
                      {...this.props}
                      onNewFeedSourceClick={this._onClickNewFeedSource}
                      feedSources={filteredFeedSources} />
                  </Panel>
                </Col>
                <Col xs={12} sm={3}>
                  {isModuleEnabled('enterprise') && !projectEditDisabled &&
                    <div style={{marginBottom: '20px'}}>
                      <Button
                        bsStyle='primary'
                        block
                        style={{marginBottom: '5px'}}
                        onClick={this._onClickDeploy}>
                        <Icon type='users' /> {this.messages('makePublic')}
                      </Button>
                      {s3Bucket &&
                        <p className='small'>
                          <strong>Note:</strong> Public feeds page can be viewed{' '}
                          <a target='_blank' href={publicFeedsLink}>here</a>.
                        </p>
                      }
                    </div>
                  }
                  <ProjectSummaryPanel
                    project={project}
                    feedSources={project.feedSources || []} />
                  <Panel header={<h3>What is a feed source?</h3>}>
                    A feed source defines the location or upstream source of a{' '}
                    GTFS feed. GTFS can be populated via automatic fetch,{' '}
                    directly editing or uploading a zip file.
                  </Panel>
                </Col>
              </Row>
            </Tab>
            {isModuleEnabled('deployment')
              ? <Tab
                eventKey='deployments'
                disabled={projectEditDisabled}
                title={
                  <span><Glyphicon className='icon-link' glyph='globe' />
                    <span className='hidden-xs'>{this.messages('deployments')}</span>
                  </span>
                }>
                <DeploymentsPanel
                  deployments={project.deployments}
                  fetchDeployments={this._fetchDeployments}
                  expanded={activeComponent === 'deployments'}
                  {...this.props} />
              </Tab>
              : null
            }
            <Tab
              eventKey='settings'
              disabled={projectEditDisabled}
              title={
                <span>
                  <Glyphicon className='icon-link' glyph='cog' />
                  <span className='hidden-xs'>{this.messages('settings')}</span>
                </span>
              }>
              <ProjectSettings
                activeSettingsPanel={activeSubComponent}
                projectEditDisabled={projectEditDisabled}
                {...this.props} />
            </Tab>
          </Tabs>
        </Grid>
      </ManagerPage>
    )
  }
}

class ProjectSummaryPanel extends Component<{feedSources: Array<Feed>, project: Project}> {
  render () {
    const { project, feedSources } = this.props
    const errorCount = feedSources
      .map(fs => fs.latestValidation ? fs.latestValidation.errorCount : 0)
      .reduce((a, b) => a + b, 0)
    // FIXME
    const serviceSeconds = feedSources
      .map(fs => fs.latestValidation ? fs.latestValidation.avgDailyRevenueTime : 0)
      .reduce((a, b) => a + b, 0)
    return (
      <Panel header={<h3>{project.name} summary</h3>}>
        <ListGroup fill>
          <ListGroupItem>Number of feeds: {feedSources.length}</ListGroupItem>
          <ListGroupItem>Total errors: {errorCount}</ListGroupItem>
          <ListGroupItem>
            Total service:{' '}
            {Math.floor(serviceSeconds / 60 / 60 * 100) / 100}{' '}
            hours per weekday
          </ListGroupItem>
        </ListGroup>
      </Panel>
    )
  }
}
