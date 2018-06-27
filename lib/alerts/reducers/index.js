// @flow

import active from './active'
import alerts from './alerts'

import type {ActiveState} from './active'
import type {AlertsReducerState} from './alerts'

export type AlertsState = ActiveState & AlertsReducerState

export default alerts.merge(active)
