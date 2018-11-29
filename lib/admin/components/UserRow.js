// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Row, Col, Button, Label, Image, ListGroupItem} from 'react-bootstrap'

import ConfirmModal from '../../common/components/ConfirmModal'
import UserPermissions from '../../common/user/UserPermissions'
import {getComponentMessages} from '../../common/util/config'
import type {UserProfile, Organization, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import UserSettings from './UserSettings'

type Props = {
  creatingUser: ManagerUserState,
  deleteUser: UserProfile => void,
  fetchProjectFeeds: string => void,
  organizations: Array<Organization>,
  projects: Array<Project>,
  saveUser: (UserProfile, any) => void,
  user: UserProfile
}

type State = {
  isEditing: boolean
}

export default class UserRow extends Component<Props, State> {
  messages = getComponentMessages('UserRow')
  state = {
    isEditing: false
  }

  toggleExpansion = () => this.setState({isEditing: !this.state.isEditing})

  cancel () {
    this.toggleExpansion()
  }

  save = () => {
    const settings = this.refs.userSettings.getSettings()
    this.props.saveUser(this.props.user, settings)
    this.toggleExpansion()
  }

  delete = () => {
    this.refs.confirm.open({
      title: `${this.messages('delete')} ${this.props.user.email}?`,
      body: this.messages('deleteConfirm'),
      onConfirm: () => {
        this.props.deleteUser(this.props.user)
        this.toggleExpansion()
      }
    })
  }

  render () {
    const {
      creatingUser,
      user,
      organizations,
      projects,
      fetchProjectFeeds
    } = this.props
    const permissions = new UserPermissions(user.app_metadata && user.app_metadata.datatools)
    const creatorIsApplicationAdmin = creatingUser.permissions &&
      creatingUser.permissions.isApplicationAdmin()
    const userOrganization = organizations.find(o => o.id === permissions.getOrganizationId())
    const creatorDoesNotHaveOrg = !creatingUser.permissions ||
      // $FlowFixMe
      !creatingUser.permissions.hasOrganization(permissions.getOrganizationId())
    // return null if creating user is not app admin and list item user is part of a different org
    if (!creatorIsApplicationAdmin && creatorDoesNotHaveOrg) {
      return null
    }
    return (
      <ListGroupItem>
        <Row className='list-group-item-heading'>
          <Col xs={4} sm={2} md={1}>
            <Image
              responsive
              rounded
              src={user.picture}
              alt={user.email} />
          </Col>
          <Col xs={8} sm={5} md={6}>
            <h5>
              {user.email}{' '}
              {permissions.isApplicationAdmin()
                ? <Label bsStyle='danger'>{this.messages('appAdmin')}</Label>
                : permissions.canAdministerAnOrganization()
                  ? <Label bsStyle='warning'>{this.messages('orgAdmin')}</Label>
                  : null
              }{' '}
              {userOrganization && creatorIsApplicationAdmin
                ? <Label bsStyle='default'>{userOrganization.name}</Label>
                : null
              }
            </h5>
            <small />
          </Col>
          <Col xs={12} sm={5} md={5}>
            <Button
              className='pull-right'
              onClick={this.toggleExpansion}>
              {this.state.isEditing
                ? <span><Icon type='remove' /> {this.messages('cancel')}</span>
                : <span><Icon type='edit' /> {this.messages('edit')}</span>
              }
            </Button>
            {this.state.isEditing
              ? <Button
                className='pull-right'
                bsStyle='primary'
                style={{marginRight: '5px'}}
                onClick={this.save}>
                <Icon type='save' /> {this.messages('save')}
              </Button>
              : null
            }
            {this.state.isEditing
              ? <Button
                className='pull-right'
                bsStyle='danger'
                style={{marginRight: '5px'}}
                onClick={this.delete}>
                <Icon type='trash' /> {this.messages('delete')}
              </Button>
              : null
            }
          </Col>
        </Row>
        <ConfirmModal ref='confirm' />
        { this.state.isEditing
          ? <UserSettings ref='userSettings'
            organizations={organizations}
            projects={projects}
            creatingUser={creatingUser}
            fetchProjectFeeds={fetchProjectFeeds}
            permissions={permissions} />
          : ''
        }
      </ListGroupItem>
    )
  }
}
