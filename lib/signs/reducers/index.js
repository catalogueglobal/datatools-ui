// @flow

import active from './active'
import signs from './signs'

import type {ActiveSign} from './active'
import type {SignsReducerState} from './signs'

export type SignsState = ActiveSign & SignsReducerState

export default signs.merge(active)
