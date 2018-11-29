// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {
  Row,
  Col,
  Button,
  InputGroup,
  FormControl,
  Glyphicon,
  ButtonToolbar,
  DropdownButton,
  MenuItem
} from 'react-bootstrap'

import {getComponentMessages, isExtensionEnabled} from '../../common/util/config'
import toSentenceCase from '../../common/util/to-sentence-case'
import type {Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import ThirdPartySyncButton from './ThirdPartySyncButton'

type Props = {
  downloadMergedFeed: Project => void,
  onNewFeedSourceClick: () => void,
  project: Project,
  searchTextChanged: string => void,
  thirdPartySync: (string, string) => void,
  updateAllFeeds: Project => void,
  user: ManagerUserState,
  visibilityFilter: any
}

export default class ProjectViewerHeader extends Component<Props> {
  messages = getComponentMessages('ProjectViewerHeader')

  _onDownloadMerged = () => this.props.downloadMergedFeed(this.props.project)

  _onSearchChange = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.searchTextChanged(evt.target.value)

  _onSelectFilter = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    console.warn(`No action set for filter change ${evt.target.value}`)

  _onUpdateProject = () => this.props.updateAllFeeds(this.props.project)

  _thirdPartySync = (type: string) =>
    this.props.thirdPartySync(this.props.project.id, type)

  render () {
    const {
      onNewFeedSourceClick,
      project,
      user,
      visibilityFilter
    } = this.props
    const projectEditDisabled = !user.permissions ||
      !user.permissions.isProjectAdmin(project.id, project.organizationId)
    return (
      <Row>
        <Col xs={4}>
          <InputGroup>
            <DropdownButton
              componentClass={InputGroup.Button}
              id='input-dropdown-addon'
              title={visibilityFilter.filter ? toSentenceCase(visibilityFilter.filter) : 'Filter'}
              onSelect={this._onSelectFilter}
            >
              <MenuItem eventKey='ALL'>All</MenuItem>
              <MenuItem eventKey='STARRED'>Starred</MenuItem>
              <MenuItem eventKey='PUBLIC'>Public</MenuItem>
              <MenuItem eventKey='PRIVATE'>Private</MenuItem>
            </DropdownButton>
            <FormControl
              placeholder={this.messages('feeds.search')}
              onChange={this._onSearchChange} />
          </InputGroup>
        </Col>
        <Col xs={8}>
          {!projectEditDisabled &&
            <Button
              bsStyle='primary'
              className='pull-right'
              data-test-id='project-header-create-new-feed-source-button'
              disabled={projectEditDisabled}
              onClick={onNewFeedSourceClick}>
              <Glyphicon glyph='plus' /> {this.messages('feeds.new')}
            </Button>
          }
          <ButtonToolbar>
            {isExtensionEnabled('transitland') || isExtensionEnabled('transitfeeds') || isExtensionEnabled('mtc')
              ? <ThirdPartySyncButton
                projectEditDisabled={projectEditDisabled}
                thirdPartySync={this._thirdPartySync} />
              : null
            }
            <Button
              bsStyle='default'
              disabled={projectEditDisabled}
              onClick={this._onUpdateProject}>
              <Icon type='cloud-download' /> {this.messages('feeds.update')}
            </Button>
            <Button
              bsStyle='primary'
              onClick={this._onDownloadMerged}>
              <Glyphicon glyph='download' /> {this.messages('mergeFeeds')}
            </Button>
          </ButtonToolbar>
        </Col>
      </Row>
    )
  }
}
