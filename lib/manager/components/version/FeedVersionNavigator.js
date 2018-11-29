// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Row, Col, ButtonGroup, ButtonToolbar, DropdownButton, MenuItem, Button, Glyphicon} from 'react-bootstrap'
import {browserHistory} from 'react-router'
import {LinkContainer} from 'react-router-bootstrap'

import {getComponentMessages, isModuleEnabled} from '../../../common/util/config'
import {isValidZipFile} from '../../../common/util/util'
import DeploymentPreviewButton from '../DeploymentPreviewButton'
import OptionButton from '../../../common/components/OptionButton'
import SelectFileModal from '../../../common/components/SelectFileModal'
import type {Feed, FeedVersion, Note, Project} from '../../../types'
import type {GtfsState, ManagerUserState} from '../../../types/reducers'

import FeedVersionViewer from './FeedVersionViewer'

type Props = {
  createDeploymentFromFeedSource: Feed => void,
  deleteDisabled: boolean,
  deleteFeedVersionConfirmed: () => any,
  disabled: boolean,
  downloadFeedClicked: () => any,
  editDisabled: boolean,
  feedSource: Feed,
  feedVersionIndex: number,
  feedVersionRenamed: () => any,
  fetchFeed: Feed => any,
  fetchGTFSEntities: any => void,
  fetchNotesForFeedVersion: FeedVersion => void,
  fetchValidationErrors: () => any,
  fetchValidationIssueCount: (FeedVersion) => void,
  gtfs: GtfsState,
  gtfsPlusDataRequested: string => void,
  hasVersions: boolean,
  isPublic: boolean,
  loadFeedVersionForEditing: () => any,
  newNotePostedForVersion: (FeedVersion, any) => void,
  project: Project,
  publishFeedVersion: FeedVersion => void,
  setVersionIndex: (Feed, number, ?boolean) => void,
  sortedVersions: Array<FeedVersion>,
  uploadFeed: (Feed, File) => void,
  user: ManagerUserState,
  version: FeedVersion,
  versionIndexDoesNotExist: boolean,
  versionSection: ?string
}

type State = {
  listView: boolean
}

export default class FeedVersionNavigator extends Component<Props, State> {
  messages = getComponentMessages('FeedVersionNavigator')
  state = {
    listView: false
  }

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.feedVersionIndex !== this.props.feedVersionIndex && nextProps.feedSource && nextProps.feedSource.feedVersions) {
      this.props.setVersionIndex(nextProps.feedSource, nextProps.feedVersionIndex, false)
    }
    if (nextProps.versionIndexDoesNotExist) {
      console.warn(`Version index ${nextProps.feedVersionIndex} is invalid.`)
      browserHistory.push(`/feed/${nextProps.feedSource.id}`)
    }
  }

  _onCreateNewVersion = (key: string) => {
    const {createDeploymentFromFeedSource, feedSource, fetchFeed} = this.props
    switch (key) {
      // case 'delete':
      //   return this.refs['deleteModal'].open()
      case 'fetch':
        return fetchFeed(feedSource)
      case 'upload':
        return this.refs['uploadModal'].open()
      case 'deploy':
        return createDeploymentFromFeedSource(feedSource)
      case 'public':
        return browserHistory.push(`/public/feed/${feedSource.id}`)
      case 'snapshot':
        return browserHistory.push(`/feed/${feedSource.id}/snapshots`)
    }
  }

  _createDeployment = () => this.props.createDeploymentFromFeedSource(this.props.feedSource)

  _decrementVersion = () => this.props.setVersionIndex(this.props.feedSource, this.props.feedVersionIndex - 1)

  _incrementVersion = () => this.props.setVersionIndex(this.props.feedSource, this.props.feedVersionIndex + 1)

  _onChangeListView = (listView: boolean) => this.setState({listView})

  _onConfirmUpload = (files: Array<File>) => {
    const {feedSource, uploadFeed} = this.props
    if (isValidZipFile(files[0])) {
      uploadFeed(feedSource, files[0])
      return true
    } else {
      return false
    }
  }

  _onFetchValidation = (version: FeedVersion) => this.props.fetchValidationIssueCount(this.props.version)

  _onVersionNotePosted = (note: Note) => this.props.newNotePostedForVersion(this.props.version, note)

  _onVersionNotesRequested = () => this.props.fetchNotesForFeedVersion(this.props.version)

  _onRequestGtfsPlusData = (version: FeedVersion) => this.props.gtfsPlusDataRequested(version.id)

  _onSelectVersion = (index: number) => {
    if (index !== this.props.feedVersionIndex) {
      this.props.setVersionIndex(this.props.feedSource, index)
    }
  }

  render () {
    const versionTitleStyle = {
      fontSize: '24px',
      fontWeight: 'bold'
    }
    const {
      disabled,
      editDisabled,
      feedSource,
      feedVersionIndex,
      hasVersions,
      isPublic,
      sortedVersions,
      user,
      versionSection
    } = this.props
    const {feedVersions: versions} = feedSource
    if (!versions) return null

    if (typeof feedVersionIndex === 'undefined') return null
    const version = hasVersions && versions[feedVersionIndex - 1]
    const deploymentForVersion =
      version &&
      feedSource.deployments &&
      feedSource.deployments.find(d => d.feedVersions.findIndex(v => v.id === version.id) !== -1)
    return (
      <div>
        <SelectFileModal ref='uploadModal'
          title='Upload Feed'
          body='Select a GTFS feed to upload:'
          onConfirm={this._onConfirmUpload}
          errorMessage='Uploaded file must be a valid zip file (.zip).' />
        <Row style={{marginBottom: '20px'}}>
          {/* Version Navigation Widget and Name Editor */}
          <Col xs={12} style={versionTitleStyle}>
            <ButtonToolbar>
              <ButtonGroup>
                <OptionButton
                  active={!this.state.listView}
                  value={false}
                  onClick={this._onChangeListView}>
                  <Icon type='square' />
                </OptionButton>
                <OptionButton
                  active={this.state.listView}
                  value={!false}
                  onClick={this._onChangeListView}>
                  <Icon type='list' />
                </OptionButton>
              </ButtonGroup>
              {this.state.listView
                ? null
                : <ButtonGroup> {/* Version Navigation/Selection Widget */}
                  {/* Previous Version Button */}
                  <Button
                    data-test-id='decrement-feed-version-button'
                    disabled={!hasVersions || !sortedVersions[feedVersionIndex - 2]}
                    href='#'
                    onClick={this._decrementVersion}>
                    <Glyphicon glyph='arrow-left' />
                  </Button>

                  {/* Version Selector Dropdown */}
                  <DropdownButton
                    href='#'
                    id='versionSelector'
                    title={`${this.messages('version')} ${feedVersionIndex} ${this.messages('of')} ${versions.length}`}
                    onSelect={this._onSelectVersion}>
                    {versions.map((version, k) => {
                      k = k + 1
                      return <MenuItem key={k} eventKey={k}>{k}. {version.name}</MenuItem>
                    })}
                  </DropdownButton>
                  {/* Next Version Button */}
                  <Button href='#'
                    disabled={!hasVersions || !sortedVersions[feedVersionIndex]}
                    onClick={this._incrementVersion}>
                    <Glyphicon glyph='arrow-right' />
                  </Button>
                </ButtonGroup>
              }
              <ButtonToolbar className='pull-right'>
                <ButtonGroup>
                  {isModuleEnabled('deployment') && deploymentForVersion
                    ? <DeploymentPreviewButton
                      deployment={deploymentForVersion}>
                      View deployment {version && version.id}
                    </DeploymentPreviewButton>
                    : null
                  }
                  {isModuleEnabled('deployment') && !isPublic
                    ? <Button
                      // Disable deployment if not permitted or no version exists
                      data-test-id='deploy-feed-version-button'
                      disabled={disabled || !hasVersions}
                      onClick={this._createDeployment}>
                      <Icon type='globe' /> Deploy feed
                    </Button>
                    : null
                  }
                  {isModuleEnabled('editor') && !isPublic
                    ? <LinkContainer to={`/feed/${feedSource.id}/edit`}>
                      <Button
                        data-test-id='edit-feed-version-button'
                        disabled={editDisabled}>
                        <Glyphicon glyph='pencil' /> Edit feed
                      </Button>
                    </LinkContainer>
                    : null
                  }
                </ButtonGroup>
                {!isPublic
                  ? <DropdownButton
                    bsStyle='success'
                    disabled={disabled}
                    title={
                      <span>
                        <Icon type='plus' /> Create new version
                      </span>
                    }
                    id='bg-nested-dropdown'
                    onSelect={this._onCreateNewVersion}>
                    <MenuItem
                      data-test-id='fetch-feed-button'
                      disabled={disabled || !feedSource.url}
                      eventKey='fetch'
                    >
                      <Glyphicon glyph='refresh' /> Fetch
                    </MenuItem>
                    <MenuItem
                      data-test-id='upload-feed-button'
                      disabled={disabled}
                      eventKey='upload'
                    >
                      <Glyphicon glyph='upload' /> Upload
                    </MenuItem>
                    <MenuItem divider />
                    <MenuItem
                      disabled={disabled ||
                        !feedSource.editorSnapshots ||
                        feedSource.editorSnapshots.length === 0
                      }
                      eventKey='snapshot'>
                      <Glyphicon glyph='camera' /> From snapshot
                    </MenuItem>
                  </DropdownButton>
                  : null
                }
              </ButtonToolbar>
            </ButtonToolbar>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <FeedVersionViewer
              {...this.props}
              isPublic={isPublic}
              feedVersionIndex={feedVersionIndex}
              versionSection={versionSection || null}
              versions={versions}
              listView={this.state.listView}
              hasVersions={hasVersions}
              fetchValidationIssueCount={this._onFetchValidation}
              gtfsPlusDataRequested={this._onRequestGtfsPlusData}
              notesRequested={this._onVersionNotesRequested}
              newNotePosted={this._onVersionNotePosted}
              user={user} />
          </Col>
        </Row>
      </div>
    )
  }
}
