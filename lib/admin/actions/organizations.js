// @flow

import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {fetchProjects} from '../../manager/actions/projects'
import type {Organization} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

export const createdOrganization = createAction(
  'CREATED_ORGANIZATION',
  (payload: Organization) => payload
)
const receiveOrganizations = createAction(
  'RECEIVE_ORGANIZATIONS',
  (payload: Array<Organization>) => payload
)
const requestingOrganizations = createVoidPayloadAction('REQUESTING_ORGANIZATIONS')

export type OrganizationsActions = ActionType<typeof createdOrganization> |
  ActionType<typeof receiveOrganizations> |
  ActionType<typeof requestingOrganizations>

export function fetchOrganizations () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingOrganizations())
    return dispatch(secureFetch('/api/manager/secure/organization'))
      .then(response => response.json())
      // .catch(err => console.log(err))
      .then(organizations => {
        dispatch(receiveOrganizations(organizations))
        return organizations
      })
  }
}

// Single Organization Actions
export function deleteOrganization (organization: Organization) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/manager/secure/organization/${organization.id}`
    return dispatch(secureFetch(url, 'delete'))
      .then(response => response.json())
      // .catch(err => console.log(err))
      .then(organization => {
        return dispatch(fetchOrganizations())
      })
  }
}

export function updateOrganization (
  organization: Organization,
  changes: Organization,
  fetchFeeds?: boolean = false
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/manager/secure/organization/${organization.id}`
    return dispatch(secureFetch(url, 'put', changes))
      .then((res) => {
        // fetch projects because a project may have been (re)assigned to an org
        dispatch(fetchProjects())
        return dispatch(fetchOrganizations())
      })
  }
}

// server call
export function createOrganization (organization: Organization) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    console.log(organization)
    const url = '/api/manager/secure/organization'
    return dispatch(secureFetch(url, 'post', organization))
      .then(response => response.json())
      .then(org => {
        dispatch(createdOrganization(org))
        // fetch projects because a project may have been (re)assigned to an org
        dispatch(fetchProjects())
        return dispatch(fetchOrganizations())
      })
  }
}
