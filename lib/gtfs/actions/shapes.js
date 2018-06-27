// @flow

import {createAction} from 'redux-actions'

import {secureFetch} from '../../common/actions'
import {compose, shapes} from '../../gtfs/util/graphql'
import {updateRoutesOnMapDisplay} from './filter'

import type {dispatchFn, getStateFn} from '../../types'

export const fetchingShapes = createAction('FETCH_GRAPHQL_SHAPES')
export const clearShapes = createAction('CLEAR_GRAPHQL_SHAPES')
export const errorFetchingShapes = createAction(
  'FETCH_GRAPHQL_SHAPES_REJECTED'
)
export const receiveShapes = createAction('FETCH_GRAPHQL_SHAPES_FULFILLED')

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
