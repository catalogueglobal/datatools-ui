import objectPath from 'object-path'
import createAction from 'redux-actions/lib/createAction'
import {browserHistory} from 'react-router'

import {secureFetch} from '../../common/actions'
import auth0 from '../../common/user/Auth0Manager'
import UserPermissions from '../../common/user/UserPermissions'
import {setErrorMessage} from './status'

const checkingExistingLogin = createAction('CHECKING_EXISTING_LOGIN')
// const createdPublicUser = createAction('CREATED_PUBLIC_USER')
const receiveRecentActivity = createAction('RECEIVE_USER_RECENT_ACTIVITY')
export const revokeToken = createAction('REVOKE_USER_TOKEN')
const userLoggedIn = createAction('USER_LOGGED_IN')
const userLogout = createAction('USER_LOGGED_OUT')
const setRedirectOnLogin = createAction('SET_REDIRECT_ON_LOGIN')

export function checkLogin (userIsLoggedIn) {
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
export function createPublicUser (credentials) {
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

// Recent Activity for User's Subscriptions
export function getRecentActivity (user) {
  return function (dispatch, getState) {
    const userId = user.profile.user_id
    const url = `/api/manager/secure/user/${userId}/recentactivity`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(activity => {
        return dispatch(receiveRecentActivity(activity))
      })
  }
}

/**
 * Login to the application with an optional URL to redirect to on a successful
 * login.
 */
export function login (redirectOnSuccess) {
  return function (dispatch, getState) {
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
export function logout (logoutFromAuth0 = true) {
  if (logoutFromAuth0) {
    auth0.logout()
  }
  return userLogout()
}

export function receiveTokenAndProfile (authResult) {
  // authResult can be null in case of first-time user
  if (!authResult) {
    return logout()
  }

  const {token, profile} = authResult
  profile.app_metadata = profile['http://catalogue/app_metadata']
  profile.user_metadata = profile['http://catalogue/user_metadata']
  return userLoggedIn({
    token,
    profile,
    permissions: new UserPermissions(profile.app_metadata.datatools)
  })
}

export function removeUserSubscription (profile, subscriptionType) {
  return function (dispatch, getState) {
    const subscriptions = profile.app_metadata.datatools.find(dt => dt.client_id === process.env.AUTH0_CLIENT_ID).subscriptions || [{type: subscriptionType, target: []}]
    const index = subscriptions.findIndex(sub => sub.type === subscriptionType)
    if (index > -1) {
      subscriptions.splice(index, 1)
    } else {
      return
    }
    return dispatch(updateUserData(profile, {subscriptions: subscriptions}))
  }
}

export function unsubscribeAll (profile) {
  return function (dispatch, getState) {
    return dispatch(updateUserData(profile, {subscriptions: []}))
  }
}

export function updateTargetForSubscription (profile, target, subscriptionType) {
  return function (dispatch, getState) {
    const subscriptions = profile.app_metadata.datatools.find(dt => dt.client_id === process.env.AUTH0_CLIENT_ID).subscriptions || [{type: subscriptionType, target: []}]
    if (subscriptions.findIndex(sub => sub.type === subscriptionType) === -1) {
      subscriptions.push({type: subscriptionType, target: []})
    }
    for (var i = 0; i < subscriptions.length; i++) {
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
    return dispatch(updateUserData(profile, {subscriptions: subscriptions}))
  }
}

// server call
export function updateUserData (user, userData) {
  return function (dispatch, getState) {
    var dtIndex = user.profile
      ? user.profile.app_metadata.datatools.findIndex(dt => dt.client_id === process.env.AUTH0_CLIENT_ID)
      : user.app_metadata.datatools.findIndex(dt => dt.client_id === process.env.AUTH0_CLIENT_ID)
    var datatools = user.profile ? user.profile.app_metadata.datatools : user.app_metadata.datatools

    if (dtIndex === -1) {
      return dispatch(setErrorMessage({message: `Could not find user metadata\n${JSON.stringify(user)}`}))
    }

    for (var type in userData) {
      datatools[dtIndex][type] = userData[type]
    }

    var payload = {
      user_id: user.user_id,
      data: datatools
    }

    const url = '/api/manager/secure/user/' + user.user_id
    return dispatch(secureFetch(url, 'put', payload))
      .then(response => response.json())
      .then(user => {
        return user
      })
  }
}

export function updateUserMetadata (profile, props) {
  return function (dispatch, getState) {
    const CLIENT_ID = process.env.AUTH0_CLIENT_ID

    const userMetadata = profile.user_metadata || {
      lang: 'en',
      datatools: [
        {
          client_id: CLIENT_ID
        }
      ]
    }
    const clientIndex = userMetadata.datatools.findIndex(d => d.client_id === CLIENT_ID)
    for (var key in props) {
      objectPath.set(userMetadata, `datatools.${clientIndex}.${key}`, props[key])
    }
    const payload = {user_metadata: userMetadata}
    const url = `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${profile.user_id}`
    return dispatch(secureFetch(url, 'PATCH', payload))
      .then(response => response.json())
      .then(user => {
        return user
      })
  }
}
