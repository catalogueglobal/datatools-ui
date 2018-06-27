// @flow

import update from 'react-addons-update'
import { getUserMetadataProperty } from '../../common/util/user'

export type UiState = {
  sidebarExpanded: boolean,
  hideTutorial: boolean
}

export const defaultState = {
  sidebarExpanded: true,
  hideTutorial: false
}

const ui = (state: UiState = defaultState, action: any): UiState => {
  switch (action.type) {
    case 'USER_LOGGED_IN':
      const hideTutorial = getUserMetadataProperty(action.profile, 'hideTutorial')
      const sidebarExpanded = getUserMetadataProperty(action.profile, 'sidebarExpanded')
      return update(state, {
        sidebarExpanded: { $set: sidebarExpanded },
        hideTutorial: { $set: hideTutorial }
      })
    case 'SETTING_TUTORIAL_VISIBILITY':
      return update(state, { hideTutorial: { $set: action.value } })
    case 'SETTING_SIDEBAR_EXPANDED':
      return update(state, { sidebarExpanded: { $set: action.value } })
    default:
      return state
  }
}

export default ui
