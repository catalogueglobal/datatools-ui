// @flow

import update from 'react-addons-update'
import moment from 'moment'

type Point = [number, number]

type State = {
  activeFeeds: any,
  dateTimeFilter: {
    date: string,
    from: number,
    to: number
  },
  loadedFeeds: Array<any>,
  map: {
    bounds: [Point, Point],
    zoom: number
  },
  patternFilter: ?string,
  permissionFilter: string,
  project: ?string,
  routeFilter: ?string,
  showArrivals: boolean,
  timepointFilter: boolean,
  typeFilter: Array<string>,
  version: any
}

const defaultState = {
  activeFeeds: {},
  dateTimeFilter: {
    date: moment().format('YYYYMMDD'),
    from: 60 * 60 * 6, // 6 AM
    to: 60 * 60 * 9 // 9 AM
  },
  loadedFeeds: [],
  map: {
    bounds: [[70, 130], [-70, -130]],
    zoom: 10
  },
  patternFilter: null,
  permissionFilter: 'view-feed',
  project: null,
  routeFilter: null,
  serviceFilter: null,
  showArrivals: false,
  timepointFilter: false,
  typeFilter: ['stops', 'routes'],
  version: null
}

const setAllFeeds = (feeds, value) => {
  const activeFeeds = Object.assign({}, feeds)
  for (const feedId in activeFeeds) {
    if (activeFeeds.hasOwnProperty(feedId)) {
      activeFeeds[feedId] = value
    }
  }
  return activeFeeds
}

const gtfsFilter = (state: State = defaultState, action: any): State => {
  switch (action.type) {
    case 'SET_ACTIVE_PROJECT':
      return update(state, {
        project: { $set: action.payload ? action.payload.id : null }
      })
    case 'SET_ACTIVE_FEEDVERSION':
      return update(state, {
        version: {$set: action.payload ? action.payload.id : null}
      })
    case 'UPDATE_GTFS_MAP_STATE':
      return update(state, {map: {$set: action.props}})
    case 'UPDATE_GTFS_PERMISSION_FILTER':
      return update(state, {permissionFilter: {$set: action.permission}})
    case 'UPDATE_GTFS_DATETIME_FILTER':
      const dateTimeFilter = {...state.dateTimeFilter}
      for (const key in action.payload) {
        dateTimeFilter[key] = action.payload[key]
      }
      return update(state, {dateTimeFilter: {$set: dateTimeFilter}})
    case 'RECEIVE_FEEDSOURCES':
      const activeFeeds = {}
      if (action.payload.feedSources) {
        action.payload.feedSources.forEach(fs => { activeFeeds[fs.id] = true })
      }
      return update(state, {activeFeeds: {$set: activeFeeds}})
    case 'UPDATE_LOADED_FEEDS':
      return update(state, {loadedFeeds: {$set: action.loadedFeeds}})
    case 'ADD_ACTIVE_FEED':
      return update(state, {activeFeeds: {[action.feed.id]: {$set: true}}})
    case 'REMOVE_ACTIVE_FEED':
      return update(state, {activeFeeds: {[action.feed.id]: {$set: false}}})
    case 'ADD_ALL_ACTIVE_FEEDS':
      return update(state, {activeFeeds: {$set: setAllFeeds(state.activeFeeds, true)}})
    case 'REMOVE_ALL_ACTIVE_FEEDS':
      return update(state, {activeFeeds: {$set: setAllFeeds(state.activeFeeds, false)}})
    case 'ROUTE_FILTER_CHANGE':
      return update(state, {routeFilter: { $set: action.payload }})
    case 'PATTERN_FILTER_CHANGE':
      return update(state, {patternFilter: { $set: action.payload }})
    case 'SHOW_ARRIVAL_CHANGE':
      return update(state, {showArrivals: { $set: action.payload }})
    case 'TIMEPOINT_CHANGE':
      return update(state, {timepointFilter: { $set: action.payload }})
    default:
      return state
  }
}

export default gtfsFilter
