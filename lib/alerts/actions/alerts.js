// @flow

import {browserHistory} from 'react-router'
import {createAction, type ActionType} from 'redux-actions'

import {fetchStopsAndRoutes} from '../../gtfs/actions/general'
import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {getAlertsUrl, getFeedId} from '../../common/util/modules'
import {setErrorMessage} from '../../manager/actions/status'
import {getActiveProject} from '../../manager/selectors'
import type {Alert, GtfsRoute, GtfsStop, Project, RtdAlert} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

const receivedRtdAlerts = createAction(
  'RECEIVED_RTD_ALERTS',
  (payload: {
    project: Project,
    rtdAlerts: Array<RtdAlert>
  }) => payload
)
const requestRtdAlerts = createVoidPayloadAction('REQUEST_RTD_ALERTS')
const updateActiveAlert = createAction(
  'UPDATE_ACTIVE_ALERT_ALERT',
  (payload: Object) => payload
)

export type AlertsActions = ActionType<typeof receivedRtdAlerts> |
  ActionType<typeof requestRtdAlerts> |
  ActionType<typeof updateActiveAlert>

let nextAlertId = 0
let nextStopEntityId = 100

export function createAlert (entity: GtfsStop | GtfsRoute, agency: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    nextAlertId--
    const entities = []

    if (entity) {
      nextStopEntityId++
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
    dispatch(updateActiveAlert({
      id: nextAlertId,
      title: '',
      affectedEntities: entities,
      published: false
    }))
    if (window.location.pathname !== '/alerts/new') {
      browserHistory.push('/alerts/new')
    }
  }
}

export function deleteAlert (alert: Alert) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    return dispatch(secureFetch(`${getAlertsUrl()}/${alert.id}`, 'delete'))
      .then((res) => res.json())
      .then(json => {
        browserHistory.push('/alerts')
        dispatch(fetchRtdAlerts())
      })
      .catch(e => console.log(e))
  }
}

export function setActiveAlert (alertId: number) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const alert = getState().alerts.all.find(a => a.id === alertId)
    if (alert) {
      dispatch(updateActiveAlert(alert))
    } else {
      console.warn(`Could not find alert with id: ${alertId}`)
    }
  }
}

export function fetchRtdAlerts () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestRtdAlerts())
    const project = getActiveProject(getState())
    if (!project) {
      return dispatch(setErrorMessage({
        message: "Can't request alerts without knowing project"
      }))
    }
    return dispatch(secureFetch(getAlertsUrl()))
      .then(res => res.json())
      .then(rtdAlerts => dispatch(receivedRtdAlerts({rtdAlerts, project})))
      .then(() => dispatch(fetchStopsAndRoutes(getState().alerts.entities, 'ALERTS')))
  }
}

export function editAlert (alert: Alert) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(updateActiveAlert(alert))
    browserHistory.push(`/alert/${alert.id}`)
  }
}

export function saveAlert (alert: Alert) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const json = {
      Id: alert.id < 0 ? null : alert.id,
      HeaderText: alert.title || 'New Alert',
      DescriptionText: alert.description || '',
      Url: alert.url || '',
      Cause: alert.cause || 'UNKNOWN_CAUSE',
      Effect: alert.effect || 'UNKNOWN_EFFECT',
      Published: alert.published ? 'Yes' : 'No',
      StartDateTime: alert.start / 1000 || 0,
      EndDateTime: alert.end / 1000 || 0,
      ServiceAlertEntities: alert.affectedEntities.map((entity) => {
        return {
          Id: entity.id,
          AlertId: alert.id,
          AgencyId: entity.agency ? getFeedId(entity.agency) : null,
          RouteId: entity.route ? entity.route.route_id : null,
          RouteShortName: entity.route ? entity.route.route_short_name : null,
          RouteType: entity.mode ? entity.mode.gtfsType : null,
          StopId: entity.stop ? entity.stop.stop_id : null,
          StopCode: entity.stop ? entity.stop.stop_code : null,
          TripId: null,
          ServiceAlertTrips: []
        }
      })
    }
    const url = getAlertsUrl() + (alert.id < 0 ? '' : '/' + alert.id)
    const method = alert.id < 0 ? 'post' : 'put'
    return dispatch(secureFetch(url, method, json))
      .then((res) => res.json())
      .then(json => {
        // On successful save, re-route back to main alerts viewer
        browserHistory.push('/alerts')
        dispatch(fetchRtdAlerts())
      })
      .catch(e => console.log(e))
  }
}
