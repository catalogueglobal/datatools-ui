// @flow

import update from 'react-addons-update'
import { getUserMetadataProperty } from '../../common/util/user'

export type UiState = {
  sidebarExpanded: boolean,
  hideTutorial: boolean
}

export const defaultState = {
  sidebarExpanded: false,
  hideTutorial: false
}

const ui = (state: UiState = defaultState, action: any): UiState => {
  switch (action.type) {
    case 'USER_PROFILE_UPDATED':
    case 'USER_LOGGED_IN':
      const {profile} = action.payload
      return {
        ...state,
        sidebarExpanded: getUserMetadataProperty(profile, 'sidebarExpanded') || false,
        hideTutorial: getUserMetadataProperty(profile, 'hideTutorial') || false
      }
    case 'SETTING_TUTORIAL_VISIBILITY':
      return update(state, { hideTutorial: { $set: action.value } })
    case 'SETTING_SIDEBAR_EXPANDED':
      return update(state, { sidebarExpanded: { $set: action.value } })
    default:
      return state
  }
}

export default ui
