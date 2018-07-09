import update from 'react-addons-update'

import UserPermissions from '../../common/user/UserPermissions'
import UserSubscriptions from '../../common/user/UserSubscriptions'

const user = (state = {
  isCheckingLogin: true,
  token: null,
  profile: null,
  permissions: null,
  recentActivity: null,
  redirectOnSuccess: null,
  subscriptions: null
}, action) => {
  switch (action.type) {
    case 'SET_REDIRECT_ON_LOGIN':
      return update(state, {redirectOnSuccess: {$set: action.payload}})
    case 'CHECKING_EXISTING_LOGIN':
      return update(state, { isCheckingLogin: { $set: true } })
    case 'USER_LOGGED_IN':
      return update(state, {
        isCheckingLogin: { $set: false },
        token: { $set: action.payload.token },
        profile: { $set: action.payload.profile },
        permissions: { $set: new UserPermissions(action.payload.profile.app_metadata.datatools) },
        subscriptions: { $set: new UserSubscriptions(action.payload.profile.app_metadata.datatools) }
      })
    case 'REVOKE_USER_TOKEN':
      return update(state, {
        token: {$set: null}
      })
    case 'USER_LOGGED_OUT':
      return update(state, {
        isCheckingLogin: { $set: false },
        token: { $set: null },
        profile: { $set: null },
        permissions: { $set: null },
        subscriptions: { $set: null }
      })
    case 'CREATED_PUBLIC_USER':
      return update(state, {
        profile: { $set: action.payload.profile },
        permissions: { $set: new UserPermissions(action.payload.profile.app_metadata.datatools) },
        subscriptions: { $set: new UserSubscriptions(action.payload.profile.app_metadata.datatools) }
      })
    case 'RECEIVE_USER_RECENT_ACTIVITY':
      return update(state, {
        recentActivity: { $set: action.payload.activity }
      })
    default:
      return state
  }
}

export default user
