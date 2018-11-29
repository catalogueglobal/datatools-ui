// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Button, Modal, FormControl, ControlLabel, FormGroup} from 'react-bootstrap'

import UserPermissions from '../../common/user/UserPermissions'
import {getComponentMessages} from '../../common/util/config'
import type {Organization, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import UserSettings from './UserSettings'

type Props = {
  createUser: ({email: string, password: string, permissions: UserPermissions}) => void,
  creatingUser: ManagerUserState,
  fetchProjectFeeds: string => void,
  organizations: Array<Organization>,
  projects: Array<Project>
}

type State = {
  email: string,
  password: string,
  showModal: boolean
}

const DEFAULT_STATE = {
  email: '',
  password: '',
  showModal: false
}

export default class CreateUser extends Component<Props, State> {
  messages = getComponentMessages('CreateUser')
  state = DEFAULT_STATE

  save = (e: SyntheticInputEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (!e.target.checkValidity()) {
      console.warn('Form inputs are invalid!')
      return
    }
    const {email, password} = this.state
    this.props.createUser({
      email,
      password,
      permissions: this.refs.userSettings.getSettings()
    })
    this.setState(DEFAULT_STATE)
  }

  _updateField = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({[evt.target.name]: evt.target.value})
  }

  cancel = () => this.setState(DEFAULT_STATE)

  open = () => this.setState({showModal: true})

  render () {
    const {
      creatingUser,
      organizations,
      projects,
      fetchProjectFeeds
    } = this.props
    const {email, password, showModal} = this.state
    return (
      <div>
        <Button
          bsStyle='primary'
          onClick={this.open}
          className='pull-right'>
          <Icon type='plus' />{' '}
          Create User
        </Button>
        <Modal
          show={showModal}
          onHide={this.cancel}>
          <Modal.Header closeButton>
            <Modal.Title>Create User</Modal.Title>
          </Modal.Header>
          <form onSubmit={this.save}>
            <Modal.Body>
              <FormGroup controlId='formControlsEmail'>
                <ControlLabel>Email Address</ControlLabel>
                <FormControl
                  name='email'
                  autoFocus
                  onChange={this._updateField}
                  value={email}
                  autoComplete='username email'
                  type='email'
                  placeholder='Enter email' />
              </FormGroup>
              <FormGroup controlId='formControlsPassword'>
                <ControlLabel>Password</ControlLabel>
                <FormControl
                  name='password'
                  onChange={this._updateField}
                  value={password}
                  minLength='8'
                  type='password'
                  placeholder='Enter password for new user'
                  autoComplete='new-password' />
              </FormGroup>
              <UserSettings
                projects={projects}
                organizations={organizations}
                fetchProjectFeeds={fetchProjectFeeds}
                creatingUser={creatingUser}
                permissions={new UserPermissions()}
                isCreating
                ref='userSettings' />
            </Modal.Body>
            <Modal.Footer>
              <Button type='submit'>{this.messages('new')}</Button>
            </Modal.Footer>
          </form>
        </Modal>
      </div>
    )
  }
}
