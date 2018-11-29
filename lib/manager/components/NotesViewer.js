// @flow

import React, {Component} from 'react'
import moment from 'moment'
import gravatar from 'gravatar'
import { Panel, Row, Col, Glyphicon, FormControl, Button, ButtonToolbar, Media } from 'react-bootstrap'

import {getComponentMessages} from '../../common/util/config'
import { getProfileLink } from '../../common/util/util'
import type {Feed, Note, FeedVersion} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  feedSource?: Feed,
  newNotePosted: ({body: string}) => void,
  notes: Array<Note>,
  notesRequested: () => void,
  stacked?: boolean,
  type: string,
  user: ManagerUserState,
  version?: FeedVersion
}

type State = {
  value: string
}

export default class NotesViewer extends Component<Props, State> {
  messages = getComponentMessages('NotesViewer')
  state = {
    value: ''
  }

  componentWillMount () {
    this.props.notesRequested()
  }

  _onChangeBody = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.setState({value: evt.target.value})

  _onClickPublish = () => {
    this.props.newNotePosted({body: this.state.value})
    this.setState({value: ''})
  }

  _getUserUrl = (email: string): string =>
    gravatar.url(email, {protocol: 'https', s: '100'})

  render () {
    const {
      notes,
      notesRequested,
      stacked,
      user
    } = this.props
    const {profile} = user
    if (!profile) {
      console.warn('Could not locate user profile', user)
      return null
    }
    const userLink = user
      ? <a href={getProfileLink(profile.email)}>{profile.email}</a>
      : 'Unknown user'
    const {Body, Heading, Left} = Media
    return (
      <Row>
        <Col
          xs={12}
          sm={stacked ? 12 : 8}
          md={stacked ? 12 : 6}>
          <h3>
            <ButtonToolbar className='pull-right'>
              <Button
                title={this.messages('refresh')}
                onClick={notesRequested}>
                <Glyphicon glyph='refresh' />
                <span className='hidden-xs'>
                  {' '}{this.messages('refresh')}
                </span>
              </Button>
            </ButtonToolbar>
            {this.messages('all')}
          </h3>
          {/* List of notes */}
          {notes && notes.length > 0
            ? notes.map(note => {
              const noteDate = moment(note.date)
              return (
                <Media key={note.id}>
                  <Left>
                    <img
                      width={64}
                      height={64}
                      src={`${this._getUserUrl(note.userEmail)}`}
                      alt={note.userEmail} />
                  </Left>
                  <Body>
                    <Panel
                      className='comment-panel'
                      header={
                        <Heading>
                          <a href={getProfileLink(note.userEmail)}>
                            {note.userEmail}
                          </a>
                          {' '}
                          <small title={noteDate.format('h:MMa, MMM. DD YYYY')}>
                            commented {noteDate.fromNow()}
                          </small>
                        </Heading>
                      }>
                      <p>{note.body || '(no content)'}</p>
                    </Panel>
                  </Body>
                </Media>
              )
            })
            : <p><i>{this.messages('none')}</i></p>
          }
        </Col>
        {/* Post note form */}
        <Col xs={12} sm={stacked ? 12 : 4} md={stacked ? 12 : 6}>
          <h3>{this.messages('postComment')}</h3>
          <Media>
            <Left>
              <img
                alt={profile.email}
                width={64}
                height={64}
                src={user ? profile.picture : ''} />
            </Left>
            <Body>
              <Panel
                className='comment-panel'
                header={<Heading>{userLink}</Heading>}>
                <FormControl
                  ref='newNoteBody'
                  componentClass='textarea'
                  value={this.state.value}
                  onChange={this._onChangeBody} />
                <Button
                  className='pull-right'
                  style={{marginTop: '10px'}}
                  disabled={this.state.value === ''}
                  onClick={this._onClickPublish}>
                  {this.messages('new')}
                </Button>
              </Panel>
            </Body>
          </Media>
        </Col>
      </Row>
    )
  }
}
