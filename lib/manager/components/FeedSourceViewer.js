// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Grid, Row, Col, Badge, Glyphicon, Tabs, Tab} from 'react-bootstrap'
import {Link, browserHistory} from 'react-router'

import {updateFeedSource} from '../actions/feeds'
import ManagerPage from '../../common/components/ManagerPage'
import {getComponentMessages, isModuleEnabled} from '../../common/util/config'
import ActiveFeedVersionNavigator from '../containers/ActiveFeedVersionNavigator'
import ActiveEditorFeedSourcePanel from '../../editor/containers/ActiveEditorFeedSourcePanel'
import {isEditingDisabled} from '../util'
import type {Feed, FeedVersion, Note, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import NotesViewer from './NotesViewer'
import FeedSourceSettings from './FeedSourceSettings'
import ManagerHeader from './ManagerHeader'

type Props = {
  activeComponent: string,
  activeSubComponent: string,
  componentDidUpdate: () => void,
  createDeployment: () => void,
  deleteFeedSource: Feed => Promise<any>,
  deleteFeedVersionConfirmed: () => void,
  downloadFeedClicked: () => void,
  externalPropertyChanged: () => void,
  feedSource: Feed,
  feedSourceId: string,
  feedSourcePropertyChanged: typeof updateFeedSource,
  feedVersionIndex: number,
  feedVersionRenamed: () => void,
  fetchFeed: Feed => void,
  fetchNotesForFeedVersion: FeedVersion => void,
  gtfsPlusDataRequested: () => void,
  isFetching: boolean,
  loadFeedVersionForEditing: () => void,
  newNotePostedForFeedSource: (Feed, Note) => void,
  newNotePostedForVersion: (FeedVersion, Note) => void,
  notesRequestedForFeedSource: Feed => void,
  onFeedSourceViewerMount: (Props) => void,
  project: Project,
  routeParams: any,
  updateUserSubscription: (ManagerUserState, string, string) => void,
  uploadFeed: (Feed, File) => void,
  user: ManagerUserState
}

export default class FeedSourceViewer extends Component<Props> {
  messages = getComponentMessages('FeedSourceViewer')

  componentWillMount () {
    this.props.onFeedSourceViewerMount(this.props)
  }

  confirmDeleteFeedSource = () => {
    const {deleteFeedSource, feedSource} = this.props
    this.refs.page.showConfirmModal({
      title: 'Delete Feed Source?',
      body: 'Are you sure you want to delete this feed source? This action cannot be undone and all feed versions will be deleted.',
      onConfirm: () => deleteFeedSource(feedSource)
        .then(() => browserHistory.push(`/project/${feedSource.projectId}`))
    })
  }

  _onSelectTab = (key: string) => browserHistory.push(
    `/feed/${this.props.feedSource.id}/${key}`
  )

  _postNote = (note: any) =>
    this.props.newNotePostedForFeedSource(this.props.feedSource, note)

  _requestNotes = () =>
    this.props.notesRequestedForFeedSource(this.props.feedSource)

  render () {
    const {
      activeComponent,
      activeSubComponent,
      externalPropertyChanged,
      feedSource,
      feedSourcePropertyChanged,
      feedVersionIndex,
      isFetching,
      project,
      routeParams,
      updateUserSubscription,
      user
    } = this.props
    if (isFetching && !feedSource) {
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
    } else if (!feedSource) {
      // If not fetching, but no feed source was fetched, show feed source not
      // found view.
      return (
        <ManagerPage ref='page'>
          <Grid fluid>
            <Row>
              <Col xs={12}>
                <p>No feed source found for <strong>{this.props.feedSourceId}</strong></p>
                <p><Link to='/project'>Return to list of projects</Link></p>
              </Col>
            </Row>
          </Grid>
        </ManagerPage>
      )
    }
    const {editorSnapshots, id: feedSourceId, name, noteCount, notes} = feedSource
    const disabled = !user.permissions || !user.permissions.hasFeedPermission(
      project.organizationId, project.id,
      feedSourceId,
      'manage-feed'
    )
    const editDisabled = isEditingDisabled(user, feedSource, project)
    const activeTab = ['settings', 'comments', 'snapshots'].indexOf(activeComponent) === -1 || typeof routeParams.feedVersionIndex !== 'undefined'
      ? ''
      : activeComponent
    return (
      <ManagerPage
        ref='page'
        title={name}>
        <Grid fluid>
          <ManagerHeader {...this.props} />
          {/* Feed Versions tab */}
          <Tabs id='feed-source-viewer-tabs'
            style={{minHeight: '400px'}}
            activeKey={activeTab}
            onSelect={this._onSelectTab}>
            <Tab
              eventKey=''
              title={
                <span>
                  <Icon className='icon-link' type='database' />
                  <span className='hidden-xs'>
                    {this.messages('gtfs')}
                  </span>
                </span>
              }>
              <Row>
                <Col xs={12}>
                  <ActiveFeedVersionNavigator
                    routeParams={routeParams}
                    feedSource={feedSource}
                    disabled={disabled}
                    versionIndex={feedVersionIndex}
                    deleteDisabled={disabled}
                    editDisabled={editDisabled}
                    {...this.props} />
                </Col>
              </Row>
            </Tab>

            {isModuleEnabled('editor')
              ? <Tab eventKey='snapshots'
                title={
                  <span>
                    <Icon className='icon-link' type='pencil-square-o' />
                    <span className='hidden-xs'>
                      {this.messages('snapshotsTitle')}{' '}
                    </span>
                    <Badge>{editorSnapshots ? editorSnapshots.length : 0}</Badge>
                  </span>
                }>
                <ActiveEditorFeedSourcePanel
                  project={project}
                  feedSource={feedSource} />
              </Tab>
              : null
            }
            {/* Comments for feed source */}
            <Tab eventKey='comments'
              title={
                <span>
                  <Glyphicon className='icon-link' glyph='comment' />
                  <span className='hidden-xs'>
                    {this.messages('notesTitle')}{' '}
                  </span>
                  <Badge>{noteCount}</Badge>
                </span>
              }
              onEnter={this._requestNotes}>
              <NotesViewer
                type='feed-source'
                notes={notes}
                feedSource={feedSource}
                user={user}
                updateUserSubscription={updateUserSubscription}
                noteCount={noteCount}
                notesRequested={this._requestNotes}
                newNotePosted={this._postNote} />
            </Tab>
            {/* Settings */}
            <Tab
              disabled={disabled}
              eventKey='settings'
              title={
                <span>
                  <Glyphicon className='icon-link' glyph='cog' />
                  <span className='hidden-xs'>
                    {this.messages('properties.title')}
                  </span>
                </span>
              }>
              <FeedSourceSettings
                activeComponent={activeComponent}
                activeSubComponent={activeSubComponent}
                confirmDeleteFeedSource={this.confirmDeleteFeedSource}
                externalPropertyChanged={externalPropertyChanged}
                feedSource={feedSource}
                feedSourcePropertyChanged={feedSourcePropertyChanged}
                project={project}
                user={user} />
            </Tab>
          </Tabs>
        </Grid>
      </ManagerPage>
    )
  }
}
