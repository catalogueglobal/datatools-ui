// @flow

import { combineReducers } from 'redux'

import users from './users'
import organizations from './organizations'

import type {UsersState} from './users'
import type {OrganizationsState} from './organizations'

export type AdminState = {
  users: UsersState,
  organizations: OrganizationsState
}

export default combineReducers({
  users,
  organizations
})
