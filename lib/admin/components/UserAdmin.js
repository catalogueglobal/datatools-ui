// @flow

import Icon from '@conveyal/woonerf/components/icon'
import * as React from 'react'
import {
  Grid,
  Row,
  Col,
  Panel,
  ListGroup,
  ListGroupItem as LGI,
  Button
} from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

import * as adminActions from '../actions/admin'
import Loading from '../../common/components/Loading'
import ManagerPage from '../../common/components/ManagerPage'
import {getComponentMessages, isModuleEnabled} from '../../common/util/config'
import UserPermissions from '../../common/user/UserPermissions'
import type {Organization, OtpServer, Project, UserProfile} from '../../types'
import type {
  AdminUsersState,
  OrganizationsState,
  ManagerUserState
} from '../../types/reducers'

import OrganizationList from './OrganizationList'
import ServerSettings from './ServerSettings'
import UserList from './UserList'

type Props = {
  activeComponent: string,
  createOrganization: any => Promise<any>,
  createUser: ({email: string, password: string, permissions: UserPermissions}) => void,
  deleteOrganization: Organization => void,
  deleteServer: typeof adminActions.deleteServer,
  deleteUser: UserProfile => void,
  fetchOrganizations: () => void,
  fetchProjectFeeds: string => void,
  isFetching: boolean,
  onComponentMount: Props => void,
  organizations: OrganizationsState,
  otpServers: Array<OtpServer>,
  projects: Array<Project>,
  saveOrganization: Organization => void,
  saveUser: (UserProfile, any) => void,
  setPage: number => void,
  setUserPermission: (UserProfile, any) => void,
  updateOrganization: (Organization, any) => void,
  updateServer: typeof adminActions.updateServer,
  user: ManagerUserState,
  userSearch: ?string => void,
  users: AdminUsersState
}

export default class UserAdmin extends React.Component<Props> {
  messages = getComponentMessages('UserAdmin')

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  _getMainContent = (isApplicationAdmin: boolean): React.Node => {
    const {
      user,
      users,
      organizations,
      otpServers,
      projects,
      activeComponent,
      setUserPermission,
      saveUser,
      deleteUser,
      fetchProjectFeeds,
      createUser,
      setPage,
      userSearch
    } = this.props
    switch (activeComponent) {
      case 'users':
        if (!users.data || !projects || !organizations.data) return <Loading />
        else {
          return <UserList
            token={user.token || 'token-invalid'}
            projects={projects}
            organizations={organizations.data}
            users={users.data}
            userCount={users.userCount}
            page={users.page}
            perPage={users.perPage}
            isFetching={users.isFetching}
            creatingUser={user}
            setUserPermission={setUserPermission}
            saveUser={saveUser}
            deleteUser={deleteUser}
            fetchProjectFeeds={fetchProjectFeeds}
            createUser={createUser}
            setPage={setPage}
            userSearch={userSearch} />
        }
      case 'organizations':
        if (!isApplicationAdmin || isModuleEnabled('enterprise')) return null
        else return <OrganizationList {...this.props} />
      case 'logs':
        return <p className='text-center' style={{marginTop: '100px'}}>
          <Button
            bsStyle='danger'
            bsSize='large'
            href='https://manage.auth0.com/#/logs'>
            <Icon type='star' /> View application logs on Auth0.com
          </Button>
        </p>
      case 'servers':
        if (!isApplicationAdmin || !isModuleEnabled('deployment')) {
          return <p className='text-center lead'>Restricted access</p>
        }
        return <ServerSettings
          projects={projects}
          otpServers={otpServers}
          updateServer={this.props.updateServer}
          deleteServer={this.props.deleteServer}
          editDisabled={false} />
      default:
        return null
    }
  }

  _getLinks = (isApplicationAdmin: boolean): React.Node[] => {
    const links = [{ to: '/admin/users', children: <LGI>User management</LGI> }]
    // Do not show non-appAdmin users these application-level settings
    if (isApplicationAdmin) {
      if (!isModuleEnabled('enterprise')) {
        links.push({ to: '/admin/organizations', children: <LGI>Organizations</LGI> })
      }
      links.push({ to: '/admin/logs', children: <LGI>Application logs</LGI> })
      if (isModuleEnabled('deployment')) {
        links.push({ to: '/admin/servers', children: <LGI>Deployment servers</LGI> })
      }
    }
    return links.map(link => (<LinkContainer key={link.to} {...link} />))
  }

  render () {
    const { user } = this.props
    const permissions = user && user.permissions
    const isAdmin = permissions &&
      (
        permissions.isApplicationAdmin() ||
        permissions.canAdministerAnOrganization()
      )
    const isApplicationAdmin = !!(permissions && permissions.isApplicationAdmin())
    return (
      <ManagerPage
        ref='page'
        title={this.messages('title')}>
        <Grid>
          <Row style={{ marginBottom: '18px' }}>
            <Col xs={12}>
              <h2>
                <LinkContainer className='pull-right' to='/home'>
                  <Button>
                    Back to dashboard
                  </Button>
                </LinkContainer>
                <Icon type='cog' /> {this.messages('title')}
              </h2>
            </Col>
          </Row>
          <Row>
            {isAdmin
              ? <div>
                <Col xs={12} sm={3}>
                  <Panel>
                    <ListGroup fill>
                      {this._getLinks(isApplicationAdmin)}
                    </ListGroup>
                  </Panel>
                </Col>
                <Col xs={12} sm={9}>
                  {this._getMainContent(isApplicationAdmin)}
                </Col>
              </div>
              : <div>
                {user
                  ? <p>{this.messages('noAccess')}</p>
                  : <h1
                    className='text-center'
                    style={{ marginTop: '150px' }}>
                    <Icon className='fa-spin fa-5x' type='refresh' />
                  </h1>
                }
              </div>
            }
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}
