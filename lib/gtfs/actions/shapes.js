// @flow

import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {compose, shapes} from '../../gtfs/util/graphql'
import type {dispatchFn, getStateFn} from '../../types/reducers'

import {updateRoutesOnMapDisplay} from './filter'

export const errorFetchingShapes = createVoidPayloadAction(
  'FETCH_GRAPHQL_SHAPES_REJECTED'
)
export const fetchingShapes = createVoidPayloadAction('FETCH_GRAPHQL_SHAPES')
export const receiveShapes = createAction(
  'FETCH_GRAPHQL_SHAPES_FULFILLED',
  (payload: Array<[number, number]>) => payload
)

export type GtfsShapesActions = ActionType<typeof errorFetchingShapes> |
  ActionType<typeof fetchingShapes> |
  ActionType<typeof receiveShapes>

export function toggleShowAllRoutesOnMap (namespace: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    let state = getState()
    dispatch(updateRoutesOnMapDisplay(!state.gtfs.filter.showAllRoutesOnMap))
    state = getState()
    if (
      state.gtfs.filter.showAllRoutesOnMap &&
      !state.gtfs.shapes.fetchStatus.fetched &&
      !state.gtfs.shapes.fetchStatus.fetching
    ) {
      dispatch(fetchingShapes())
      return dispatch(secureFetch(compose(shapes, {namespace})))
        .then(response => response.json())
        .then(json => {
          const {patterns} = json.data.feed
          const shapes = patterns.map(pattern => {
            return pattern.shape.map(point => [
              point.shape_pt_lat,
              point.shape_pt_lon
            ])
          })
          dispatch(receiveShapes(shapes))
        })
    }
  }
}
