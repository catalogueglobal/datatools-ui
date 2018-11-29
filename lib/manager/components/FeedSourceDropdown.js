// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { browserHistory } from 'react-router'
import { MenuItem, Dropdown, Glyphicon, Button } from 'react-bootstrap'

import { isValidZipFile } from '../../common/util/util'
import ConfirmModal from '../../common/components/ConfirmModal'
import SelectFileModal from '../../common/components/SelectFileModal'
import WatchButton from '../../common/containers/WatchButton'
import { isModuleEnabled, getConfigProperty } from '../../common/util/config'
import type {Feed, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  createDeploymentFromFeedSource: (Feed) => void,
  deleteFeedSource: (Feed) => void,
  feedSource: Feed,
  fetchFeed: (Feed) => void,
  project: Project,
  setHold: (?Feed) => void,
  uploadFeed: (Feed, File) => void,
  user: ManagerUserState
}

export default class FeedSourceDropdown extends Component<Props> {
  _selectItem = (key: string) => {
    switch (key) {
      case 'delete':
        return this.deleteFeed()
      case 'fetch':
        return this.props.fetchFeed(this.props.feedSource)
      case 'upload':
        return this._uploadFeed()
      case 'deploy':
        return this.props.createDeploymentFromFeedSource(this.props.feedSource)
      case 'public':
        return browserHistory.push(`/public/feed/${this.props.feedSource.id}`)
    }
  }

  deleteFeed () {
    this.props.setHold(this.props.feedSource)
    // Delete immediately if feed source is being created.
    if (this.props.feedSource.isCreating) return this._onDelete()
    // Otherwise, show delete modal.
    this.refs.deleteModal.open()
  }

  _uploadFeed () {
    this.props.setHold(this.props.feedSource)
    this.refs.uploadModal.open()
  }

  confirmUpload = (files: Array<File>) => {
    const {feedSource, setHold, uploadFeed} = this.props
    const file = files[0]
    if (isValidZipFile(file)) {
      uploadFeed(feedSource, file)
      setHold(null)
      return true
    } else {
      return false
    }
  }

  _onClickEdit = () => browserHistory.push(`/feed/${this.props.feedSource.id}/edit/`)

  _onCloseModal = () => this.props.setHold(null)

  _onDelete = () => this.props.deleteFeedSource(this.props.feedSource)

  render () {
    const {
      feedSource,
      project,
      user
    } = this.props
    const {permissions, subscriptions} = user
    const disabled = !permissions ||
      !permissions.hasFeedPermission(project.organizationId, project.id, feedSource.id, 'manage-feed')
    const isWatchingFeed = subscriptions &&
      subscriptions.hasFeedSubscription(project.id, feedSource.id, 'feed-updated')
    const editGtfsDisabled = !permissions ||
      !permissions.hasFeedPermission(project.organizationId, project.id, feedSource.id, 'edit-gtfs')

    return <div>
      <ConfirmModal
        ref='deleteModal'
        title='Delete Feed Source?'
        body={`Are you sure you want to delete the feed source ${feedSource.name}?`}
        onConfirm={this._onDelete}
        onClose={this._onCloseModal} />
      <SelectFileModal
        ref='uploadModal'
        title='Upload Feed'
        body='Select a GTFS feed to upload:'
        onConfirm={this.confirmUpload}
        onClose={this._onCloseModal}
        errorMessage='Uploaded file must be a valid zip file (.zip).' />
      <Dropdown
        className='pull-right'
        bsStyle='default'
        bsSize='small'
        onSelect={this._selectItem}
        id={`feed-source-action-button`}
        pullRight>
        <Button
          bsStyle='default'
          disabled={editGtfsDisabled}
          onClick={this._onClickEdit}>
          <Glyphicon glyph='pencil' /> Edit
        </Button>
        <Dropdown.Toggle bsStyle='default' />
        <Dropdown.Menu>
          <MenuItem disabled={disabled || !feedSource.url} eventKey='fetch'><Glyphicon glyph='refresh' /> Fetch</MenuItem>
          <MenuItem disabled={disabled} eventKey='upload'><Glyphicon glyph='upload' /> Upload</MenuItem>

          {/* show divider only if deployments and notifications are enabled (otherwise, we don't need it) */}
          {isModuleEnabled('deployment') || getConfigProperty('application.notifications_enabled')
            ? <MenuItem divider />
            : null
          }
          {isModuleEnabled('deployment')
            ? <MenuItem
              disabled={disabled || !feedSource.deployable || !feedSource.latestValidation}
              title={disabled
                ? 'You do not have permission to deploy feed'
                : !feedSource.deployable
                  ? 'Feed source is not deployable. Change in feed source settings.'
                  : !feedSource.latestValidation
                    ? 'No versions exist. Create new version to deploy feed'
                    : 'Deploy feed source.'
              }
              eventKey='deploy'>
              <Glyphicon glyph='globe' /> Deploy
            </MenuItem>
            : null
          }
          {getConfigProperty('application.notifications_enabled')
            ? <WatchButton
              isWatching={isWatchingFeed}
              user={user}
              target={feedSource.id}
              subscriptionType='feed-updated'
              componentClass='menuItem' />
            : null
          }
          <MenuItem disabled={!feedSource.isPublic} eventKey='public'><Glyphicon glyph='link' /> View public page</MenuItem>
          <MenuItem divider />
          <MenuItem
            data-test-id='feed-source-dropdown-delete-feed-source-button'
            disabled={disabled}
            eventKey='delete'
          >
            <Icon type='trash' /> Delete
          </MenuItem>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  }
}
