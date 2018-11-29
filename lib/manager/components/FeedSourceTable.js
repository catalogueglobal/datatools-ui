// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import moment from 'moment'
import { Button, ListGroupItem, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { shallowEqual } from 'react-pure-render'

import EditableTextField from '../../common/components/EditableTextField'
import {
  getComponentMessages,
  isModuleEnabled,
  getConfigProperty
} from '../../common/util/config'
import type {Feed, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import FeedSourceDropdown from './FeedSourceDropdown'

type Props = {
  createDeploymentFromFeedSource: () => void,
  deleteFeedSource: () => void,
  feedSources: Array<Feed>,
  fetchFeed: () => void,
  isFetching: boolean,
  onNewFeedSourceClick: () => void,
  project: Project,
  saveFeedSource: any => void,
  updateFeedSource: (Feed, any) => void,
  uploadFeed: (Feed, File) => void,
  user: ManagerUserState
}

type State = {
  activeFeedSource: ?Feed,
  holdFeedSource: ?Feed
}

export default class FeedSourceTable extends Component<Props, State> {
  messages = getComponentMessages('FeedSourceTable')
  state = {
    activeFeedSource: null,
    holdFeedSource: null
  }

  _onHover = (activeFeedSource: ?Feed) => this.setState({activeFeedSource})

  _setHold = (holdFeedSource: ?Feed) => this.setState({holdFeedSource})

  render () {
    const {
      project,
      user,
      createDeploymentFromFeedSource,
      deleteFeedSource,
      uploadFeed,
      fetchFeed,
      isFetching,
      feedSources,
      updateFeedSource,
      saveFeedSource,
      onNewFeedSourceClick
    } = this.props
    const {activeFeedSource, holdFeedSource} = this.state
    const hover = activeFeedSource && <FeedSourceDropdown
      feedSource={activeFeedSource}
      project={project}
      user={user}
      createDeploymentFromFeedSource={createDeploymentFromFeedSource}
      deleteFeedSource={deleteFeedSource}
      uploadFeed={uploadFeed}
      fetchFeed={fetchFeed}
      setHold={this._setHold} />
    const isNotAdmin = !user.permissions ||
      !user.permissions.isProjectAdmin(project.id, project.organizationId)
    return (
      <ListGroup fill>
        {isFetching
          ? <ListGroupItem className='text-center'><Icon className='fa-2x fa-spin' type='refresh' /></ListGroupItem>
          : feedSources.length
            ? feedSources.map((feedSource) => {
              return <FeedSourceTableRow
                key={feedSource.id || Math.random()}
                feedSource={feedSource}
                project={project}
                user={user}
                updateFeedSource={updateFeedSource}
                saveFeedSource={saveFeedSource}
                hoverComponent={hover}
                onHover={this._onHover}
                active={!!(activeFeedSource) && activeFeedSource.id === feedSource.id}
                hold={!!(holdFeedSource) && holdFeedSource.id === feedSource.id} />
            })
            : <ListGroupItem className='text-center'>
              <Button
                bsStyle='success'
                data-test-id='create-first-feed-source-button'
                disabled={isNotAdmin}
                onClick={onNewFeedSourceClick}>
                <Icon type='plus' /> {this.messages('createFirst')}
              </Button>
            </ListGroupItem>
        }
      </ListGroup>
    )
  }
}

type RowProps = {
  active: boolean,
  feedSource: Feed,
  hold: boolean,
  hoverComponent: any,
  onHover: (?Feed) => void,
  project: Project,
  saveFeedSource: (any) => void,
  updateFeedSource: (Feed, any) => void,
  user: ManagerUserState
}

type RowState = {
  hovered: boolean
}

class FeedSourceTableRow extends Component<RowProps, RowState> {
  state = {
    hovered: false
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !shallowEqual(nextProps.feedSource, this.props.feedSource) || this.props.active !== nextProps.active
  }

  _onChange = name => {
    const {feedSource, saveFeedSource, project, updateFeedSource} = this.props
    if (feedSource.isCreating) saveFeedSource({projectId: project.id, name})
    else updateFeedSource(feedSource, {name})
  }

  _onEnter = () => this.props.onHover(this.props.feedSource)

  _onLeave = () => {
    if (!this.props.hold) {
      this.props.onHover(null)
    }
  }

  render () {
    const {
      feedSource,
      user,
      project,
      active,
      hoverComponent
    } = this.props
    // const na = (<span style={{ color: 'lightGray' }}>N/A</span>)
    const disabled = !user.permissions ||
      !user.permissions.hasFeedPermission(
        project.organizationId,
        project.id,
        feedSource.id,
        'manage-feed'
      )
    return (
      <ListGroupItem
        key={feedSource.id}
        onMouseEnter={this._onEnter}
        onMouseLeave={this._onLeave}>
        <div>
          <span
            className='pull-right'
            style={{marginTop: '5px'}}>
            {active
              ? hoverComponent
              : null
            }
          </span>
          <h4 style={{margin: '0px'}}>
            <EditableTextField
              isEditing={(feedSource.isCreating === true)}
              value={feedSource.name}
              rejectEmptyValue
              inline
              hideEditButton
              disabled={disabled}
              onChange={this._onChange}
              link={`/feed/${feedSource.id}`} />
            {' '}
            {!feedSource.isPublic ? <Icon className='text-warning' title='This feed source and all its versions are private.' type='lock' /> : null}
            {' '}
            {/* feedSource.editedSinceSnapshot
              ? <Icon style={{display: 'inline-block', paddingBottom: '3px', verticalAlign: 'middle', fontSize: '50%'}} className='text-warning' title='There are unpublished edits for this feed source.' type='circle' />
              : <Icon style={{display: 'inline-block', paddingBottom: '3px', verticalAlign: 'middle', fontSize: '50%'}} className='text-success' title='No edits since last publish.' type='circle' />
            */}
          </h4>
          <FeedSourceAttributes feedSource={feedSource} />
        </div>
      </ListGroupItem>
    )
  }
}

class FeedSourceAttributes extends Component<{feedSource: Feed}> {
  messages = getComponentMessages('FeedSourceAttributes')

  render () {
    const {feedSource} = this.props
    const dateFormat = getConfigProperty('application.date_format') || ''
    const {latestValidation: versionSummary} = feedSource
    let dateString = ''
    let latestValidationEndMoment, isExpired, endDate, timeTo
    let errorCount = 0
    if (versionSummary) {
      latestValidationEndMoment = moment(versionSummary.endDate, 'YYYYMMDD')
      isExpired = latestValidationEndMoment.isBefore(moment())
      endDate = latestValidationEndMoment.format(dateFormat)
      errorCount = versionSummary.errorCount
      timeTo = moment().to(latestValidationEndMoment)
      dateString = isExpired
        ? `Latest version expired ${timeTo} (${endDate})`
        : `Latest version expires ${timeTo} (${endDate})`
    }
    return (
      <ul className='list-inline' style={{marginBottom: '0px'}}>
        <FeedSourceAttribute
          text={feedSource.lastUpdated
            ? `${this.messages('lastUpdated')} ${moment(feedSource.lastUpdated).format(dateFormat)}`
            : 'No versions exist yet.'
          }
          minWidth={200} />
        <FeedSourceAttribute
          icon={errorCount ? 'exclamation-triangle' : versionSummary ? 'check' : 'circle-o'}
          className={errorCount ? 'text-warning' : versionSummary ? 'text-success' : 'text-muted'}
          text={errorCount ? `${errorCount}` : undefined}
          title={errorCount ? `Latest version has ${errorCount} errors` : versionSummary ? 'Latest version is issue free!' : null}
          minWidth={40} />
        <FeedSourceAttribute
          icon={isExpired ? 'calendar-times-o' : versionSummary ? 'calendar-check-o' : 'calendar-o'}
          className={isExpired ? 'text-danger' : versionSummary ? 'text-success' : 'text-muted'}
          title={dateString}
          minWidth={40} />
        {isModuleEnabled('deployment')
          ? <FeedSourceAttribute
            icon={feedSource.deployable ? 'map' : 'map-o'}
            className={feedSource.deployable ? 'text-success' : 'text-muted'}
            minWidth={40}
            title={feedSource.deployable ? 'Feed source may be deployed to trip planner' : 'Depoyment to trip planner currently disabled'} />
          : null
        }
        {feedSource.url
          ? <FeedSourceAttribute
            icon={'link'}
            title={feedSource.url}
            className={'text-muted'}
            minWidth={40} />
          : null
        }
      </ul>
    )
  }
}

type AttributeProps = {
  className?: string,
  icon?: string,
  minWidth: number,
  text?: ?string,
  title?: ?string
}

class FeedSourceAttribute extends Component<AttributeProps> {
  render () {
    const { className, icon, minWidth, text, title } = this.props
    const li = (
      <li
        style={{
          minWidth: `${minWidth}px`,
          textAlign: icon ? 'center' : 'left'
        }}
        className={className}>
        {icon && <Icon type={icon} />}
        {text && ` ${text}`}
      </li>
    )
    return title
      ? <OverlayTrigger placement='bottom' overlay={<Tooltip id={title}>{title}</Tooltip>}>
        {li}
      </OverlayTrigger>
      : li
  }
}
