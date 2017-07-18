import { connect } from 'react-redux'
import { browserHistory } from 'react-router-dom'

import UserAdmin from '../components/UserAdmin'
import {
  fetchUsers,
  createUser,
  deleteUser,
  setUserPage,
  setUserQueryString
} from '../actions/admin'
import { fetchOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../actions/organizations'
import { updateUserData } from '../../manager/actions/user'
import { fetchProjects } from '../../manager/actions/projects'
import { fetchProjectFeeds } from '../../manager/actions/feeds'

const mapStateToProps = (state, ownProps) => {
  return {
    projects: state.projects.all,
    user: state.user,
    users: state.admin.users,
    organizations: state.admin.organizations,
    activeComponent: ownProps.match.params.subpage
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onComponentMount: (initialProps) => {
      if (!initialProps.activeComponent) {
        browserHistory.push('/admin/users')
      }
      if (!initialProps.users.data) {
        dispatch(fetchUsers())
      }

      // always load projects to prevent interference with public feeds viewer loading of projects
      dispatch(fetchProjects())

      // load orgs because they're needed both in org and user creation
      dispatch(fetchOrganizations())
    },
    fetchProjectFeeds: (project) => { dispatch(fetchProjectFeeds(project)) },
    fetchOrganizations: () => { dispatch(fetchOrganizations()) },
    createOrganization: (org) => { return dispatch(createOrganization(org)) },
    deleteOrganization: (org) => { return dispatch(deleteOrganization(org)) },
    updateOrganization: (org, settings) => { return dispatch(updateOrganization(org, settings)) },
    saveUser: (user, permissions) => {
      dispatch(updateUserData(user, permissions))
      .then(() => {
        dispatch(fetchUsers())
      })
    },
    deleteUser: (user) => { dispatch(deleteUser(user)) },
    // setUserPermission: (user, permissions) => { dispatch(setUserPermission(user, permissions)) },
    createUser: (credentials) => { dispatch(createUser(credentials)) },
    setPage: (page) => {
      dispatch(setUserPage(page))
      dispatch(fetchUsers())
    },
    userSearch: (queryString) => {
      dispatch(setUserPage(0))
      dispatch(setUserQueryString(queryString))
      dispatch(fetchUsers())
    }
  }
}

const ActiveUserAdmin = connect(
  mapStateToProps,
  mapDispatchToProps
)(UserAdmin)

export default ActiveUserAdmin
