// @flow

import {createAction, type ActionType} from 'redux-actions'

import {fetchGraphQL} from '../../common/actions'
import { getFeedId } from '../../common/util/modules'
import {mapPatternShape} from '../../editor/util/gtfs'
import {getActiveProject} from '../../manager/selectors'
import { stopsAndRoutes, patternsAndStopsForBoundingBox } from '../util/graphql'
import type {Feed, GtfsStop} from '../../types'
import type {dispatchFn, getStateFn, ValidationPattern} from '../../types/reducers'

const receivedGtfsElements = createAction(
  'RECEIVED_GTFS_ELEMENTS',
  (payload: {
    patterns: Array<ValidationPattern>,
    stops: Array<GtfsStop>
  }) => payload
)
const receivedStopsAndRoutes = createAction(
  'RECEIVED_GTFS_STOPS_AND_ROUTES',
  (payload: {
    feedId: string,
    moduleType: string,
    results: {
      feed: {
        namespace: string,
        routes?: Array<{
          route_id: string,
          route_long_name: string,
          route_short_name: string
        }>,
        stops?: Array<{
          stop_code: string,
          stop_id: string,
          stop_name: string
        }>
      }
    }
  }) => payload
)

export type GtfsGeneralActions = ActionType<typeof receivedGtfsElements> |
  ActionType<typeof receivedStopsAndRoutes>

export function fetchStopsAndRoutes (entities: Array<any>, moduleType: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const activeProject = getActiveProject(getState())
    // map entities to entity IDs requested
    // Split requests by feed IDs
    const entitiesPerFeed = {}
    const skippedFeeds = []
    if (activeProject) {
      for (var i = 0; i < entities.length; i++) {
        const {AgencyId: agencyId, RouteId: routeId, StopId: stopId} = entities[i].entity
        // Find feed source for entity's agency ID
        const feed = activeProject.feedSources &&
          activeProject.feedSources.find(f => getFeedId(f) === agencyId)
        if (!feed || !feed.publishedVersionId) {
          // Skip feed if was not matched with AgencyId or the namespace is null
          // (i.e., there is no published version).
          if (skippedFeeds.indexOf(agencyId) === -1) {
            skippedFeeds.push(agencyId)
            console.warn(`Skipping GTFS entity request for ${agencyId}. Feed either not found or unpublished.`, activeProject)
          }
          continue
        }
        const {publishedVersionId: namespace} = feed
        // Is this the right feed ID for the GraphQL query?
        const entityList = entitiesPerFeed[feed.id] || {namespace, routeId: [], stopId: []}
        if (routeId !== null && entityList.routeId.indexOf(routeId) === -1) {
          entityList.routeId.push(routeId)
        }
        if (stopId !== null && entityList.stopId.indexOf(stopId) === -1) {
          entityList.stopId.push(stopId)
        }
        entitiesPerFeed[feed.id] = entityList
      }
    }
    const entityRequests = Object.keys(entitiesPerFeed)
      .map(feedId => {
        const {namespace, routeId, stopId} = entitiesPerFeed[feedId]
        return dispatch(fetchGraphQL({
          query: stopsAndRoutes(namespace, routeId, stopId),
          variables: {namespace, routeId, stopId}
        }))
          .then(data => dispatch(receivedStopsAndRoutes({feedId, results: data, moduleType})))
      })
    return Promise.all(entityRequests)
  }
}

function getStopsRoutesForBounds (feed: Feed, bounds: any, entities) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const maxLat = bounds.getNorth()
    const maxLon = bounds.getEast()
    const minLat = bounds.getSouth()
    const minLon = bounds.getWest()
    const {publishedVersionId: namespace} = feed
    return dispatch(fetchGraphQL({
      query: patternsAndStopsForBoundingBox(namespace, entities, maxLat, maxLon, minLat, minLon),
      variables: {namespace, maxLat, maxLon, minLat, minLon}
    }))
      .then(data => ({results: data, feed}))
  }
}

export function refreshGtfsElements (feeds: Array<Feed>, entities: Array<any>) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {bounds} = getState().gtfs.filter.map
    const queries = feeds
      // FIXME: Need to filter on selected feeds?
      .filter(feed => feed.publishedVersionId)
      .map(feed => dispatch(getStopsRoutesForBounds(feed, bounds, entities)))
    return Promise
      .all(queries)
      // Process results for each feed query.
      .then(responses => {
        const allPatterns = []
        const allStops = []
        responses.forEach(response => {
          const {results, feed} = response
          if (results.feed) {
            // Only process results if fetch was successful.
            const {stops, patterns} = results.feed
            // Add feed to stops
            const processedStops = stops && stops.map(s => ({...s, feed}))
            const processedPatterns = patterns && patterns
            // Convert pattern shape points to geoJSON
              .map(mapPatternShape)
              // Add feed object to patterns
              .map(p => ({...p, feed}))
            // Entities must be mapped to options here in order to make use of
            // feed references.
            stops && allStops.push(...processedStops)
            patterns && allPatterns.push(...processedPatterns)
          } else {
            // Skip results processing if there was not a successful response.
            console.warn(`Could not search GTFS entities (spatial query) for ${feed.name}`, results)
          }
        })
        return dispatch(receivedGtfsElements({
          stops: allStops,
          patterns: allPatterns
        }))
      })
  }
}
