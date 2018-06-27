// @flow

import update from 'react-addons-update'
import { getConfigProperty } from '../../common/util/config'

export type LanguagesState = {
  active: any,
  all: any
}

export const defaultState = {
  all: getConfigProperty('messages.all'),
  // set active default to english
  active: getConfigProperty('messages.active')
}

const languages = (state: LanguagesState = defaultState, action: any): LanguagesState => {
  let languageIndex
  switch (action.type) {
    case 'SET_ACTIVE_LANGUAGE':
      languageIndex = state.all.findIndex(l => l.id === action.languageId)
      window.DT_CONFIG.messages.active = state.all[languageIndex]
      window.localStorage.setItem('lang', action.languageId)
      return update(state, {active: { $set: state.all[languageIndex] }})
    default:
      return state
  }
}

export default languages
