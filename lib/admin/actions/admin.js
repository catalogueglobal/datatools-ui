// @flow

import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {setErrorMessage} from '../../manager/actions/status'
import type {OtpServer, UserProfile} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

const SERVER_URL = `/api/manager/secure/servers`

export const createdUser = createAction(
  'CREATED_USER',
  (payload: UserProfile) => payload
)
export const receiveUsers = createAction(
  'RECEIVE_USERS',
  (payload: {
    totalUserCount: number,
    users: Array<UserProfile>
  }) => payload
)
export const receiveServers = createAction(
  'RECEIVE_SERVERS',
  (payload: Array<OtpServer>) => payload
)
export const requestingUsers = createVoidPayloadAction('REQUESTING_USERS')
export const setUserPage = createAction(
  'SET_USER_PAGE',
  (payload: number) => payload
)
export const setUserQueryString = createAction(
  'SET_USER_QUERY_STRING',
  (payload: string) => payload
)

export type AdminActions = ActionType<typeof createdUser> |
  ActionType<typeof receiveUsers> |
  ActionType<typeof requestingUsers> |
  ActionType<typeof setUserPage> |
  ActionType<typeof setUserQueryString> |
  ActionType<typeof deleteServer> |
  ActionType<typeof fetchServers> |
  ActionType<typeof updateServer>

export function fetchUsers () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingUsers())
    const queryString = getState().admin.users.userQueryString

    let countUrl = '/api/manager/secure/usercount'
    if (queryString) countUrl += `?queryString=${queryString}`
    const getCount = dispatch(secureFetch(countUrl))
      .then(response => response.json())

    let usersUrl = `/api/manager/secure/user?page=${getState().admin.users.page}`
    if (queryString) usersUrl += `&queryString=${queryString}`
    const getUsers = dispatch(secureFetch(usersUrl))
      .then(response => response.json())

    Promise.all([getCount, getUsers]).then((results) => {
      if (Array.isArray(results[1])) {
        return dispatch(receiveUsers({
          totalUserCount: results[0],
          users: results[1]
        }))
      } else if (results[1].message) {
        return dispatch(setErrorMessage({
          message: results[1].message
        }))
      } else {
        return dispatch(setErrorMessage({
          message: 'Received unexpected response'
        }))
      }
    })
  }
}

// server call
export function createUser (credentials: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = '/api/manager/secure/user'
    return dispatch(secureFetch(url, 'post', credentials))
      .then(response => response.json())
      .then(profile => {
        dispatch(createdUser(profile))
        return dispatch(fetchUsers())
      })
  }
}

// server call
export function deleteUser (profile: UserProfile) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/manager/secure/user/${profile.user_id}`
    return dispatch(secureFetch(url, 'delete'))
      .then(response => response.json())
      .then(result => {
        return dispatch(fetchUsers())
      })
  }
}

/**
 * Fetch all OTP/R5 server targets.
 */
export function fetchServers () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    return dispatch(secureFetch(`${SERVER_URL}`))
      .then(res => res.json())
      .then(servers => dispatch(receiveServers(servers)))
  }
}

/**
 * Update or create OTP/R5 server target.
 */
export function updateServer (server: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {id} = server
    const url = id ? `${SERVER_URL}/${id}` : SERVER_URL
    const method = id ? 'put' : 'post'
    dispatch(secureFetch(url, method, server))
      .then(res => res.json())
      .then(server => dispatch(fetchServers()))
  }
}

/**
 * Delete OTP/R5 server target.
 */
export function deleteServer (server: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {id} = server
    return dispatch(secureFetch(`${SERVER_URL}/${id}`, 'delete', server))
      .then(res => res.json())
      .then(server => dispatch(fetchServers()))
  }
}
