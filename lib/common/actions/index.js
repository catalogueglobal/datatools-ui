// @flow

import fetch from 'isomorphic-fetch'

import {GTFS_GRAPHQL_PREFIX} from '../../common/constants'
import { setErrorMessage } from '../../manager/actions/status'
import type {dispatchFn, getStateFn} from '../../types/reducers'

export function createVoidPayloadAction (type: string) {
  return () => ({ type })
}

export function secureFetch (url: string, method: string = 'get', payload: any, raw: boolean = false, isJSON: boolean = true, actionOnFail: any): any {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    let {token} = getState().user
    // FIXME What if authentication is turned off.
    if (!token) {
      console.warn('Cannot fetch without user token.')
      token = 'no_auth'
    }
    const headers: {[string]: string} = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
    if (isJSON) {
      headers['Content-Type'] = 'application/json'
    }
    const body = payload && isJSON
      ? JSON.stringify(payload)
      : payload
    return fetch(url, {method, headers, body})
      // Catch basic error during fetch
      .catch(err => dispatch(setErrorMessage({message: `Error making request: (${err})`})))
      .then(res => {
        // if raw response is requested
        if (raw) return res
        let action, message
        // check for errors
        const {status} = res
        if (status >= 500) {
          action = 'RELOAD'
          message = `Network error!\n\n(${method} request on ${url})`
          dispatch(setErrorMessage({message, action}))
          return null
        } else if (status >= 400) {
          action = status === 401
            ? 'LOG_IN'
            : actionOnFail
          res.json()
            .then(json => {
              const {detail, message} = json
              const unknown = `Unknown (${status}) error occurred while making request`
              dispatch(setErrorMessage({
                message: message || JSON.stringify(json) || unknown,
                action,
                detail
              }))
            })
          return null
        } else {
          return res
        }
      })
  }
}

function graphQLErrorsToString (errors: Array<{locations: any, message: string}>): Array<string> {
  return errors.map(e => {
    const locations = e.locations.map(JSON.stringify).join(', ')
    return `- ${e.message} (${locations})\n`
  })
}

export function fetchGraphQL ({
  errorMessage,
  query,
  variables
}: {
  errorMessage?: string,
  query: string,
  variables: any
}): any {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const body = {
      query,
      variables
    }
    return dispatch(secureFetch(GTFS_GRAPHQL_PREFIX, 'post', body))
      .then(res => res.json())
      .then(json => {
        if (json.errors && json.errors.length) {
          dispatch(setErrorMessage({
            message: errorMessage || 'Error fetching GTFS entities via GraphQL',
            // action,
            detail: graphQLErrorsToString(json.errors)
          }))
        } else {
          return json.data
        }
      })
      .catch(err => console.log(err))
  }
}
