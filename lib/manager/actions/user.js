// @flow

import objectPath from 'object-path'
import {browserHistory} from 'react-router'
import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import auth0 from '../../common/user/Auth0Manager'
import UserPermissions from '../../common/user/UserPermissions'
import {setErrorMessage} from './status'

import type {RecentActivity, UserProfile} from '../../types'
import type {dispatchFn, getStateFn, ManagerUserState} from '../../types/reducers'

const checkingExistingLogin = createVoidPayloadAction('CHECKING_EXISTING_LOGIN')
const receiveRecentActivity = createAction(
  'RECEIVE_USER_RECENT_ACTIVITY',
  (payload: Array<RecentActivity>) => payload
)
export const revokeToken = createVoidPayloadAction('REVOKE_USER_TOKEN')
const setRedirectOnLogin = createAction(
  'SET_REDIRECT_ON_LOGIN',
  (payload: boolean) => payload
)
const updatingUserData = createVoidPayloadAction('UPDATING_USER_DATA')
const userLoggedIn = createAction(
  'USER_LOGGED_IN',
  (payload: {
    permissions: UserPermissions,
    profile: any,
    token: string
  }) => payload
)
const userLogout = createVoidPayloadAction('USER_LOGGED_OUT')
const userProfileUpdated = createAction(
  'USER_PROFILE_UPDATED',
  (payload: UserProfile) => payload
)

export type UserActions = ActionType<typeof checkingExistingLogin> |
  ActionType<typeof receiveRecentActivity> |
  ActionType<typeof revokeToken> |
  ActionType<typeof setRedirectOnLogin> |
  ActionType<typeof updatingUserData> |
  ActionType<typeof userLoggedIn> |
  ActionType<typeof userLogout> |
  ActionType<typeof userProfileUpdated>

/**
 * Utility function to find the client/application-specific entry in the datatools
 * metadata object.
 */
function findClientId (datatoolsObject) {
  return datatoolsObject.client_id === process.env.AUTH0_CLIENT_ID
}

export function checkLogin (userIsLoggedIn: boolean) {
  return [
    checkingExistingLogin(),
    auth0.renewSessionIfNeeded({
      logout,
      receiveTokenAndProfile,
      userIsLoggedIn
    })
  ]
}

// server call
export function createPublicUser (credentials: any) {
  window.alert('This feature is no longer maintained')
  // const url = '/api/manager/public/user'
  // return fetchAction({
  //   next: (err, res) => {
  //     if (err) {
  //       return alert('An error occurred while trying to create the user.')
  //     }
  //     return createdPublicUser(res)
  //   },
  //   options: {
  //     body: credentials,
  //     method: 'POST'
  //   },
  //   url
  // })
}

/**
 * Fetch the recent activity for the user's subscriptions.
 */
export function getRecentActivity (user: ManagerUserState) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    if (!user.profile) throw new Error('Profile does not exist in user state')
    const {user_id: userId} = user.profile
    const url = `/api/manager/secure/user/${userId}/recentactivity`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(activity => dispatch(receiveRecentActivity(activity)))
  }
}

/**
 * Login to the application with an optional URL to redirect to on a successful
 * login.
 */
export function login (redirectOnSuccess: boolean) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(setRedirectOnLogin(redirectOnSuccess))
    // Login component exists at login route.
    browserHistory.push('/login')
  }
}

/**
 * Log user out from redux store and potentially from auth0 too
 * @param  {Boolean} [logoutFromAuth0=true] Whether or not to logout of auth0
 *   This should be set to false if a user is not yet logged in to avoid
 *   an infinite loop
 * @return {Action}  The userLogout action
 */
export function logout (logoutFromAuth0: ?boolean = true) {
  if (logoutFromAuth0) {
    auth0.logout()
  }
  return userLogout()
}

/**
 * Update user's user_metadata object. Unlike app_metadata, a user can make this
 * request without requiring a server call because this object is intended to
 * store data about user preferences in the application (see
 * https://auth0.com/docs/metadata for more info).
 */
export function updateUserMetadata (profile: ?UserProfile, props: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    if (!profile) {
      console.warn('User profile is empty.  Not updating profile')
      return
    }
    const {user_id: userId, user_metadata: userMetadata} = profile
    const hasDatatoolsEntry = userMetadata && userMetadata.datatools
    const updatedMetadata = hasDatatoolsEntry
      ? userMetadata
      : { lang: 'en', datatools: [] }
    if (updatedMetadata.datatools.findIndex(findClientId) === -1) {
      // User metadata exists but does not have a DT entry for this CLIENT_ID
      updatedMetadata.datatools.push({ client_id: process.env.AUTH0_CLIENT_ID })
    }
    const clientIndex = updatedMetadata.datatools.findIndex(findClientId)
    for (const key in props) {
      objectPath.set(updatedMetadata, `datatools.${clientIndex}.${key}`, props[key])
    }
    const payload = {user_metadata: updatedMetadata}
    const auth0Domain = process.env.AUTH0_DOMAIN
    if (!auth0Domain) throw new Error('Auth0 domain must be set in config!')
    const url = `https://${auth0Domain}/api/v2/users/${userId}`
    return dispatch(secureFetch(url, 'PATCH', payload))
      .then(response => response.json())
      .then(user => user)
  }
}

export function receiveTokenAndProfile (authResult: {profile: UserProfile, token: string}) {
  // authResult can be null in case of first-time user
  if (!authResult) {
    return logout()
  }
  const {token, profile} = authResult
  if (!profile.app_metadata) {
    throw new Error('Auth0 not configured properly. Could not locate app_metadata in user profile.')
  }
  return userLoggedIn({
    token,
    profile,
    permissions: new UserPermissions(profile.app_metadata.datatools)
  })
}

/**
 * Unsubscribe user from all subscriptions.
 */
export function unsubscribeAll (profile: UserProfile) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    return dispatch(updateUserData(profile, {subscriptions: []}))
  }
}

/**
 * Adds or removes a subscription to the provided target (e.g., feed source,
 * project, deployment ID) for the requesting user.
 */
export function updateTargetForSubscription (profile: UserProfile, target: string, subscriptionType: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const subscriptions = profile.app_metadata.datatools.find(findClientId).subscriptions ||
      [{type: subscriptionType, target: []}]
    if (subscriptions.findIndex(sub => sub.type === subscriptionType) === -1) {
      subscriptions.push({type: subscriptionType, target: []})
    }
    for (let i = 0; i < subscriptions.length; i++) {
      const sub = subscriptions[i]
      if (sub.type === subscriptionType) {
        const index = sub.target.indexOf(target)
        if (index > -1) {
          sub.target.splice(index, 1)
        } else {
          sub.target.push(target)
        }
      }
    }
    return dispatch(updateUserData(profile, {subscriptions}))
  }
}

/**
 * Update application/client ID specific datatools object with provided user data.
 */
export function updateUserData (user: any, userData: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(updatingUserData())
    // FIXME: Currently there are some implementations of this method that pass
    // profile as an argument and others that pass user.
    const appMetadata = user.profile ? user.profile.app_metadata : user.app_metadata
    const dtIndex = appMetadata.datatools.findIndex(findClientId)

    if (dtIndex === -1) {
      return dispatch(setErrorMessage({
        message: `Could not find user metadata\n${JSON.stringify(user)}`
      }))
    }
    // Update each key in existing datatools object with updated user data.
    for (const key in userData) {
      appMetadata.datatools[dtIndex][key] = userData[key]
    }
    const url = `/api/manager/secure/user/${user.user_id}`
    // Make request to server
    return dispatch(secureFetch(url, 'put', {
      user_id: user.user_id,
      data: appMetadata.datatools
    }))
      .then(response => response.json())
      .then(updatedProfile => {
        const {profile} = getState().user
        if (!profile) throw new Error('Could not find user profile in state.')
        const currentUserId = profile.user_id
        if (updatedProfile.user_id === currentUserId) {
          // If user being updated matches the logged in user, update their
          // profile in the application state.
          dispatch(userProfileUpdated(updatedProfile))
        }
      })
  }
}
