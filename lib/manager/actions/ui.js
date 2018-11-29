// @flow

import {createAction, type ActionType} from 'redux-actions'

import type {dispatchFn, getStateFn} from '../../types/reducers'

import { updateUserMetadata } from './user'

const settingSidebarExpanded = createAction(
  'SETTING_SIDEBAR_EXPANDED',
  (payload: boolean) => payload
)
const settingTutorialVisibility = createAction(
  'SETTING_TUTORIAL_VISIBILITY',
  (payload: boolean) => payload
)

export type UiActions = ActionType<typeof settingSidebarExpanded> |
  ActionType<typeof settingTutorialVisibility>

export function setSidebarExpanded (value: boolean) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(settingSidebarExpanded(value))
    dispatch(updateUserMetadata(getState().user.profile, {sidebarExpanded: value}))
  }
}

export function setTutorialHidden (value: boolean) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(settingTutorialVisibility(value))
    dispatch(updateUserMetadata(getState().user.profile, {hideTutorial: value}))
  }
}
