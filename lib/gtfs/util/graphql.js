// @flow

import {GTFS_GRAPHQL_PREFIX} from '../../common/constants'

// variable names/keys must match those specified in GraphQL schema
export function compose (query: string, variables: Object) {
  return `${GTFS_GRAPHQL_PREFIX}?query=${encodeURIComponent(query)}&variables=${encodeURIComponent(JSON.stringify(variables))}`
}

export const feed = `
query feedQuery($namespace: String) {
  feeds (namespace: $namespace) {
    namespace,
    # feed_publisher_name,
    # feed_publisher_url,
    # feed_lang,
    # feed_version,
    # route_count,
    # stop_count,
    mergedBuffer
  }
}
`

export const allRoutes = `
query allRoutesQuery($namespace: String) {
  feed(namespace: $namespace) {
    routes (limit: -1) {
      route_id
      route_short_name
      route_long_name
    }
  }
}
`

export const routeDetails = `
query routeDetailsQuery(
  $date: String,
  $namespace: String,
  $routeLimit: Int,
  $routeOffset: Int
) {
  feed(namespace: $namespace) {
    row_counts {
      routes
    }
    routes (limit: $routeLimit, offset: $routeOffset) {
      route_id
      route_short_name
      route_long_name
      route_desc
      stops (limit: -1) {
        stop_id
      }
      trips (limit: -1, date: $date) {
        pattern_id
        stop_times(limit: 1) {
          arrival_time
          departure_time
        }
      }
    }
  }
}
`

export const patterns = `
query patternsQuery(
  $date: String,
  $namespace: String,
  $routeId: [String]
) {
  feed (namespace: $namespace) {
    routes (route_id: $routeId) {
      route_id,
      route_short_name,
      route_long_name,
      patterns (limit: -1) {
        pattern_id,
        name,
        shape (limit: -1) {
          lat: shape_pt_lat
          lon: shape_pt_lon
        },
        stops (limit: -1) {
          stop_id
        }
        trips (
          date: $date,
          limit: -1
        ) {
          stop_times (limit: 1) {
            arrival_time
            departure_time
          }
        }
      }
      stops {
        location_type
        stop_code
        stop_desc
        stop_id
        stop_lat
        stop_lon
        stop_name
        stop_url
        wheelchair_boarding
        zone_id
      }
    }
  }
}
`

export const stops = `
  query allStopsQuery($namespace: String) {
    stops(namespace: $namespace) {
      stops {
        stop_id,
        stop_name,
        stop_code,
        stop_desc,
        stop_lon,
        stop_lat,
        zone_id,
        stop_url,
        stop_timezone
      }
    }
  }
  `

export const timetables = `
query timetablesQuery(
  $namespace: String,
  $patternId: [String],
  $date: String,
  $from: Int,
  $to: Int
) {
  feed(namespace: $namespace) {
    patterns(pattern_id: $patternId) {
      stops(limit: -1) {
        stop_id
        stop_name
      }
      trips(date: $date, from: $from, to: $to, limit: -1) {
        direction_id
        pattern_id
        service_id
        stop_times(limit: -1) {
          arrival_time
          departure_time
          stop_id
          stop_sequence
          timepoint
        }
        trip_headsign
        trip_id
        trip_short_name
      }
    }
  }
}`

export const shapes = `
query shapesQuery(
  $namespace: String
) {
  feed (namespace: $namespace) {
    patterns(limit: -1) {
      shape(limit: -1) {
        shape_pt_lat
        shape_pt_lon
        shape_pt_sequence
      }
    }
  }
}
`

export const allStops = `
query allStopsQuery($namespace: String) {
  stops(namespace: $namespace) {
    stops {
      stop_id,
      stop_name,
      stop_name,
      stop_code,
      stop_desc,
      stop_lon,
      stop_lat,
      zone_id,
      stop_url,
      stop_timezone
    }
  }
}
`
// FIXME: allows for multiple feedIds
export const patternsAndStopsForBoundingBox = (
  namespace: string,
  entities: Array<string>,
  maxLat: number,
  maxLon: number,
  minLat: number,
  minLon: number
) => `
  query patternsAndStopsGeo($namespace: String, $max_lat: Float, $max_lon: Float, $min_lat: Float, $min_lon: Float){
     ${entities.indexOf('routes') !== -1
      ? `patterns(namespace: $namespace, max_lat: $max_lat, max_lon: $max_lon, min_lat: $min_lat, min_lon: $min_lon){
         pattern_id,
         shape (limit: -1) {
           lat: shape_pt_lat
           lon: shape_pt_lon
         },
         name,
         route {
           route_id,
           route_short_name,
           route_long_name,
           route_color,
           feed{
             namespace
           },
         }
       },`
      : ''
     }
    ${entities.indexOf('stops') !== -1
      ? `stops(namespace: $namespace, max_lat: $max_lat, max_lon: $max_lon, min_lat: $min_lat, min_lon: $min_lon){
          stop_id,
          stop_code,
          stop_name,
          stop_desc,
          stop_lat,
          stop_lon,
          feed{
            namespace
          }
        }`
      : ''
    }
  }
`

// for use in entity fetching for signs / alerts
export const stopsAndRoutes = (namespace: string, routeId: ?string, stopId: ?string) => `
  query routeStopQuery($namespace: String, ${routeId ? '$routeId: [String],' : ''}, ${stopId ? '$stopId: [String],' : ''}){
    feeds(feed_id: $feedId){
      namespace,
      ${stopId
        ? `stops (stop_id: $stopId){
            stop_id,
            stop_name,
            stop_code
          },`
        : ''
      }
      ${routeId
        ? `routes(route_id: $routeId){
            route_id,
            route_short_name,
            route_long_name,
          },`
        : ''
      }
    }
  }
`

// FIXME: Stop stats are not supported yet in gtfs-api, so this is broken.
// TODO: add back in patternId filter
export function stopsFiltered (
  namespace: ?string,
  routeId: ?string,
  patternId: ?string,
  date: string,
  from: number,
  to: number
) {
  const hasFrom = typeof from !== 'undefined' && from !== null
  const hasTo = typeof to !== 'undefined' && to !== null
  const query = `
  query filteredStopsQuery(
    ${namespace ? '$namespace: String,' : ''}
    ${routeId ? '$routeId: [String],' : ''}
    ${patternId ? '$patternId: [String],' : ''}
    # ${date ? '$date: String,' : ''}
    # ${hasFrom ? '$from: Long,' : ''}
    # ${hasTo ? '$to: Long' : ''}
    ) {
    feed(${namespace ? 'namespace: $namespace' : ''}) {
      ${patternId ? 'patterns' : routeId ? 'routes' : 'stops'}
        (${routeId ? 'route_id: $routeId,' : ''} ${patternId ? 'pattern_id: $patternId' : ''}) {
        stops (limit: -1) {
          stop_id,
          stop_name,
          stop_name,
          stop_code,
          stop_desc,
          stop_lon,
          stop_lat,
           ${date && hasFrom && hasTo
              ? `
              # stats(date: $date, from: $from, to: $to){
              #   headway,
              #   tripCount
              # },
              # transferPerformance(date: $date, from: $from, to: $to){
              #   fromRoute,
              #   toRoute,
              #   bestCase,
              #   worstCase,
              #   typicalCase
              # },
              `
            : ''}
          # zone_id,
          # stop_url,
          # stop_timezone
        }
      }
    }
  }
  `
  return query
}
