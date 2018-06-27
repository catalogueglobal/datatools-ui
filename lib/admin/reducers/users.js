// @flow

import update from 'react-addons-update'

export type UsersState = {
  isFetching: boolean,
  data: any,
  userCount: number,
  page: number,
  perPage: number,
  userQueryString: ?string
}

export const defaultState = {
  isFetching: false,
  data: null,
  userCount: 0,
  page: 0,
  perPage: 10,
  userQueryString: null
}

const users = (state: UsersState = defaultState, action: any): UsersState => {
  switch (action.type) {
    case 'REQUESTING_USERS':
      return update(state, {isFetching: { $set: true }})
    case 'RECEIVE_USERS':
      return update(state, {
        isFetching: { $set: false },
        data: { $set: action.users },
        userCount: { $set: action.totalUserCount }
      })
    case 'CREATED_USER':
      if (state.data) {
        return update(state, {data: { $push: [action.profile] }})
      }
      return state
    case 'SET_USER_PAGE':
      return update(state, {page: { $set: action.page }})
    case 'SET_USER_QUERY_STRING':
      return update(state, {userQueryString: { $set: action.queryString }})
    default:
      return state
  }
}

export default users
