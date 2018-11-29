// @flow

import fetch from 'isomorphic-fetch'
import moment from 'moment'
import { browserHistory } from 'react-router'
import {createAction, type ActionType} from 'redux-actions'

import {getSignConfigUrl, getDisplaysUrl, getFeedId} from '../../common/util/modules'
import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {getHeaders} from '../../common/util/util'
import {fetchStopsAndRoutes} from '../../gtfs/actions/general'
import {getActiveProject} from '../../manager/selectors'
import type {Display, Route, Sign, Stop} from '../../types'
import type {dispatchFn, getStateFn, ManagerUserState} from '../../types/reducers'

export const receivedGtfsEntities = createAction(
  'RECEIVED_SIGN_GTFS_ENTITIES',
  (payload: {
    gtfsObjects: any,
    gtfsSigns: any
  }) => payload
)
export const receivedRtdDisplays = createAction(
  'RECEIVED_RTD_DISPLAYS',
  (payload: {
    activeProject: any,
    rtdDisplays: any
  }) => payload
)
export const receivedRtdSigns = createAction(
  'RECEIVED_RTD_SIGNS',
  (payload: {
    activeProject: any,
    rtdSigns: any
  }) => payload
)
export const requestRtdSigns = createVoidPayloadAction('REQUEST_RTD_SIGNS')
export const updateActiveSign = createAction(
  'UPDATE_ACTIVE_SIGN',
  (payload: Sign) => payload
)

export type SignActions = ActionType<typeof receivedGtfsEntities> |
  ActionType<typeof receivedRtdDisplays> |
  ActionType<typeof receivedRtdSigns> |
  ActionType<typeof requestRtdSigns> |
  ActionType<typeof updateActiveSign>

let nextSignId = 0
let nextStopEntityId = 100

export function createSign (
  entity: Stop | Route,
  agency: any
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    nextSignId--
    const entities = []

    if (entity) {
      nextStopEntityId++
      // $FlowFixMe yes, stop_id may be undefined, that's why were checking it, flow!
      const type = typeof entity.stop_id !== 'undefined' ? 'STOP' : 'ROUTE'
      const newEntity = {}
      newEntity.id = nextStopEntityId
      newEntity.type = type

      if (agency !== null) {
        newEntity.agency = agency
      }
      const typeKey = type.toLowerCase()
      newEntity[typeKey] = entity
      entities.push(newEntity)
    }

    const sign = {
      editedDate: moment().format('YYYY-MM-DD'),
      editedBy: '',
      id: nextSignId,
      title: '', // 'New Configuration',
      affectedEntities: entities,
      published: false,
      displays: []
    }
    browserHistory.push('/signs/new')
    dispatch(updateActiveSign(sign))
  }
}

export function deleteSign (sign: Sign) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    console.log('deleting', sign)
    const {user} = getState()
    if (!user.token) {
      console.warn('user not logged in, unable to delete sign')
      return
    }
    const {token} = user
    const url = getSignConfigUrl() + '/' + sign.id
    const method = 'delete'
    console.log('url/method', url, method)
    fetch(url, {
      method,
      headers: getHeaders(token)
    }).then((res) => {
      console.log('status=' + res.status)
      return res.json()
    }).then(json => {
      console.log(json)
      const saveDisplays = []
      const newSignId = null
      if (sign.displays) {
        sign.displays.map(display => {
          display.DraftDisplayConfigurationId = newSignId
          saveDisplays.push(saveDisplay(display, user))
        })
      }
      return Promise.all(saveDisplays).then((results) => {
        // console.log(results)
        browserHistory.push('/signs')
        dispatch(fetchRtdSigns())
      })
    })
  }
}

export function setActiveSign (signId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const sign = getState().signs.all.find(a => a.id === signId)
    if (!sign) {
      console.warn(`sign with id ${signId} not found, unable to set active sign`)
      return
    }
    dispatch(updateActiveSign(sign))
  }
}

export function fetchRtdDisplays () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    return fetch(getDisplaysUrl())
      .then(res => res.json())
      .then(displays => {
        dispatch(receivedRtdDisplays(displays, getActiveProject(getState())))
      })
    // .catch(error => console.log(error))
  }
}

export function fetchRtdSigns () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestRtdSigns())
    return fetch(getSignConfigUrl()).then((res) => {
      return res.json()
    }).then((signs) => {
      dispatch(receivedRtdSigns(signs, getActiveProject(getState())))
      dispatch(fetchRtdDisplays())
    }).then(() => {
      return dispatch(fetchStopsAndRoutes(getState().signs.entities, 'SIGNS'))
    })
  }
}

export function editSign (sign: Sign) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(updateActiveSign(sign))
    browserHistory.push('/sign/' + sign.id)
  }
}

export const createDisplay = (name: string) => {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    console.log('creating display', name)
    const display = {
      ContactEmailList: null,
      DisplayLatitude: null,
      DisplayLongitude: null,
      DisplayStatus: 'Inactive',
      DisplayTitle: name,
      DraftDisplayConfigurationId: null,
      EditedBy: null,
      EditedDate: moment().format('YYYY-MM-DDTHH:mm:ss.SSSSSS'),
      Id: -1,
      LocationDescription: '',
      PrimaryCptAgencyId: null,
      PublishedDisplayConfigurationId: null,
      StopPublicId: null
    }
    return saveDisplay(display, getState().user)
  }
}

export function saveDisplay (display: Display, user: ManagerUserState) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = display.Id < 0 ? getDisplaysUrl() : getDisplaysUrl() + '/' + display.Id
    if (!user.token) {
      console.warn('user not logged in, unable to save display')
      return
    }
    const method = display.Id < 0 ? 'post' : 'put'
    return fetch(url, {
      method,
      headers: getHeaders(user.token),
      body: JSON.stringify(display)
    }).then((res) => {
      console.log('status=' + res.status)
    }).catch(error => console.log(error))
  }
}

function signEntityToRtd (entity: any, sign: Sign) {
  return entity.route
    ? entity.route.map(r => {
      return {
        Id: entity.id,
        DisplayConfigurationId: sign.id,
        AgencyId: entity.agency ? getFeedId(entity.agency) : null,
        RouteId: r ? r.route_id : null,
        StopId: entity.stop ? entity.stop.stop_id : null
      }
    })
    : []
}

export function saveSign (sign: Sign) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const user = getState().user
    const detailsArray = sign.affectedEntities.map(entity => signEntityToRtd(entity, sign))

    // flatten display config details array
    const details = [].concat.apply([], detailsArray)
    const json = {
      Id: sign.id < 0 ? null : sign.id,
      ConfigurationDescription: sign.title || 'New Configuration',
      DraftDisplayConfigurationStatus: sign.published ? 'Published' : 'Unpublished',
      DisplayConfigurationDetails: details
    }
    const url = getSignConfigUrl() + (sign.id < 0 ? '' : '/' + sign.id)
    const method = sign.id < 0 ? 'post' : 'put'
    dispatch(secureFetch(url, method, json))
      .then(res => res.json())
      .then(json => {
        const saveDisplays = []
        const newSignId = json.SequenceId ? json.SequenceId : sign.id
        if (sign.displays) {
          sign.displays.map(display => {
            if (display.DraftDisplayConfigurationId === sign.id) {
              display.DraftDisplayConfigurationId = newSignId
            }
            if (display.PublishedDisplayConfigurationId === sign.id) {
              display.PublishedDisplayConfigurationId = newSignId
            }
            saveDisplays.push(saveDisplay(display, user))
          })
        }
        return Promise.all(saveDisplays).then((results) => {
          browserHistory.push('/signs')
          dispatch(fetchRtdSigns())
        })
      })
      .catch(error => console.log(error))
  }
}
