// @flow

import {setProfile} from '../../common/user/Auth0Manager'
import UserPermissions from '../../common/user/UserPermissions'
import UserSubscriptions from '../../common/user/UserSubscriptions'

import type {Action, RecentActivity, UserProfile} from '../../types'

export type UserState = {
  isCheckingLogin: boolean,
  token: ?string,
  profile: ?UserProfile,
  permissions: ?UserPermissions,
  recentActivity: ?Array<RecentActivity>,
  subscriptions: ?UserSubscriptions
}

export const defaultState = {
  isCheckingLogin: true,
  token: null,
  profile: null,
  permissions: null,
  recentActivity: null,
  redirectOnSuccess: null,
  subscriptions: null
}

const user = (state: UserState = defaultState, action: Action): UserState => {
  switch (action.type) {
    case 'SET_REDIRECT_ON_LOGIN':
      return {...state, redirectOnSuccess: action.payload}
    case 'CHECKING_EXISTING_LOGIN':
      return {...state, isCheckingLogin: true}
    case 'USER_LOGGED_IN':
      return {
        ...state,
        isCheckingLogin: false,
        token: action.payload.token,
        profile: action.payload.profile,
        permissions: new UserPermissions(action.payload.profile.app_metadata.datatools),
        subscriptions: new UserSubscriptions(action.payload.profile.app_metadata.datatools)
      }
    case 'USER_PROFILE_UPDATED':
      const {profile} = action.payload
      setProfile(profile)
      return {
        ...state,
        profile,
        permissions: new UserPermissions(profile.app_metadata.datatools),
        subscriptions: new UserSubscriptions(profile.app_metadata.datatools)
      }
    case 'REVOKE_USER_TOKEN':
      return {...state, token: null}
    case 'USER_LOGGED_OUT':
      return {
        ...state,
        isCheckingLogin: false,
        token: null,
        profile: null,
        permissions: null,
        subscriptions: null
      }
    case 'CREATED_PUBLIC_USER':
      return {
        ...state,
        profile: action.payload.profile,
        permissions: new UserPermissions(action.payload.profile.app_metadata.datatools),
        subscriptions: new UserSubscriptions(action.payload.profile.app_metadata.datatools)
      }
    case 'RECEIVE_USER_RECENT_ACTIVITY':
      return {...state, recentActivity: action.payload}
    default:
      return state
  }
}

export default user
