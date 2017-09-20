import React, {PropTypes, Component} from 'react'
import {Marker, Tooltip, FeatureGroup, GeoJSON} from 'react-leaflet'
import {divIcon} from 'leaflet'
// import MarkerClusterGroup from 'react-leaflet-markercluster'
import {shallowEqual} from 'react-pure-render'
import moment from 'moment'
import ll from '@conveyal/lonlat'
import along from 'turf-along'
import point from 'turf-point'
import lineString from 'turf-linestring'
import {getControlPointSnap} from '../../editor/util/map'
import bearing from 'turf-bearing'

import MarkerCluster from './MarkerCluster'
import DirectionIconsLayer from '../../editor/components/map/DirectionIconsLayer'

export default class GtfsRealtimeLayer extends Component {
  static propTypes = {
    routes: PropTypes.array,
    trips: PropTypes.array,
    vehiclePositions: PropTypes.object
  }

  state = {}

  _onClickVehicle = ({entity, route, trip}) => {
    this.props.setActiveVehicle({entity, route, trip})
    const feedId = this.props.version.id.split('.zip')[0]
    if (trip) {
      this.props.fetchStopTimes(feedId, [trip.trip_id])
      const {pattern_id: patternId} = trip
      this.props.fetchStops({feedId, patternId})
    }
  }

  _getPattern = (trip, route) => {
    if (trip && trip.pattern) {
      return trip.pattern
    } else if (route) {
      return route && route.patterns && route.patterns.find(p => p.pattern_id === trip.pattern_id)
    }
  }

  render () {
    const {routes, trips, mapState, stops, vehiclePositions} = this.props
    const {entity: activeEntity, route: activeRoute} = this.state
    const markers = []
    let activeMarker
    vehiclePositions && vehiclePositions.entity && vehiclePositions.entity.forEach(entity => {
      const trip = trips.find(t => entity.vehicle.trip && t.trip_id === entity.vehicle.trip.trip_id)
      const route = trip && routes.find(r => r.route_id === trip.route_id)
      const pattern = this._getPattern(trip, route)
      const active = activeEntity && entity.vehicle.vehicle.id === activeEntity.vehicle.vehicle.id
      markers.push(<VehicleMarker
        key={entity.id}
        trip={trip}
        active={active}
        activeId={activeEntity && activeEntity.vehicle.vehicle.id}
        route={route}
        activeRoute={activeRoute}
        zoom={mapState.zoom}
        onClick={this._onClickVehicle}
        entity={entity} />)
      activeMarker = (
        <div key={entity.id}>
          {activeEntity && entity.id === activeEntity.id
            ? <RabbitMarker
              trip={trip}
              pattern={pattern}
              stops={stops} />
            : null
          }
        </div>
      )
    })
    // console.log(this.state)
    // console.log(routes, trips, vehiclePositions)
    // const colors = trips && trips.map(t => ([t.id, ]))
    return (
      <div>
        <FeatureGroup wrapperOptions={{enableDefaultStyle: true}} id='positions'>
          {/*  <MarkerCluster
            // focusMarker={this.props.focusMarker}
            markers={markers}
            // newMarkerData={this.props.newMarkerData}
            // updateMarkers={this.props.updateMarkers}
          /> */}
          {markers}
          {activeMarker}
        </FeatureGroup>
        <FeatureGroup id='position-geometry'>
          {vehiclePositions && vehiclePositions.entity && trips && trips.map(trip => {
            let route = routes.find(r => r.route_id === trip.route_id)
            if (!route) {
              route = routes.find(r => r.patterns && r.patterns.find(p => p.pattern_id === trip.pattern_id) && r)
            }
            const pattern = this._getPattern(trip, route)
            if (!pattern) return null
            const active = activeEntity && activeEntity.vehicle.trip && trip.trip_id === activeEntity.vehicle.trip.trip_id
            const opacity = !this.state.trip
              ? 0.8
              : this.state.trip.trip_id === trip.trip_id
              ? 1.0
              : 0.4
            const color = active
              ? 'yellow'
              : route && route.route_color
              ? route.route_color
              : 'blue'
            if (active) {
              return (
                <div key={`geojson-${trip.trip_id}`}>
                  <DirectionIconsLayer
                    mapState={mapState}
                    patternCoordinates={pattern.geometry.coordinates} />
                  <GeoJSON
                    data={pattern.geometry}
                    opacity={opacity}
                    color={color}>
                    <Tooltip sticky><span>{trip.trip_headsign}</span></Tooltip>
                  </GeoJSON>
                </div>
              )
            } else {
              return null
            }
          })}
        </FeatureGroup>
      </div>
    )
  }
}

class VehicleMarker extends Component {
  componentWillReceiveProps (nextProps) {
    if (this.props.entity.vehicle.position !== nextProps.entity.vehicle.position) {
      // animation magic
      const step = 0
      const numSteps = 500 // Change this to set animation resolution
      const timePerStep = 20 // Change this to alter animation speed
      const pSource = '' // map.getSource('peep')
      // const interval = setInterval(() => {
      //   step += 1
      //   if (step > numSteps) {
      //     clearInterval(interval)
      //   } else {
      //     var curDistance = step / numSteps * iPathLength
      //     var iPoint = turf.along(iPath, curDistance, 'miles')
      //     pSource.setData(iPoint)
      //     console.log(curDistance)
      //   }
      // }, timePerStep)
    }
  }

  _onClick = () => {
    const {active, entity, route, trip} = this.props
    if (!active) {
      this.props.onClick({entity, route, trip})
    } else {
      this.props.onClick(entity: null, route: null, trip: null)
    }
  }

  render () {
    const {active, activeId, entity, zoom, previous, route, trip} = this.props
    // console.log(trip, route, previous)
    // const dir = previous && bearing([previous.vehicle.position.longitude, previous.vehicle.position.latitude], [entity.vehicle.position.longitude, entity.vehicle.position.latitude])
    // console.log(dir)

    // Hide buses at low zoom levels
    if (route && route.route_type === 3 && zoom < 13) return null
    const color = 'blue' // trip && trip.trip_id || 'blue'
    const tripId = trip ? trip.trip_id : entity.vehicle && entity.vehicle.trip ? entity.vehicle.trip.trip_id : '?'
    const opacity = active ? 1.0 : activeId ? 0.45 : 0.7
    const vehicleType = !trip // if trip entity is missing, this is a mystery vehicle!
      ? 'question'
      : route && route.route_type === 3
      ? 'bus'
      : route && route.route_type <= 2
      ? 'train'
      : route && route.route_type === 4
      ? 'ship'
      : 'rocket' // TODO: change
    const boatIcon = divIcon({
      html: `<span title="${entity.id}" class="fa-stack" style="opacity: ${opacity}">
              <i class="fa fa-circle fa-stack-2x" style="color: #ffffff"></i>
              <i class="fa fa-${vehicleType} fa-stack-1x" style="color: ${color}"></i>
            </span>`,
      className: '',
      iconSize: [24, 24]
    })
    return (
      <Marker
        key={`vehicle-marker-${entity.vehicle.id}`}
        icon={boatIcon}
        zIndexOffset={active ? 2000 : 500}
        onClick={this._onClick}
        position={[entity.vehicle.position.latitude, entity.vehicle.position.longitude]}>
        <Tooltip><span>Vehicle ID: {entity.vehicle.vehicle.id} (trip ID: {tripId}) (route ID: {route ? route.route_id : '?'})</span></Tooltip>
      </Marker>
    )
  }
}

class RabbitMarker extends Component {
  componentWillReceiveProps (nextProps) {
    // if (this.props.entity.vehicle.position !== nextProps.entity.vehicle.position) {
    //   // animation magic
    //   const step = 0
    //   const numSteps = 500 // Change this to set animation resolution
    //   const timePerStep = 20 // Change this to alter animation speed
    //   const pSource = '' // map.getSource('peep')
    //   // const interval = setInterval(() => {
    //   //   step += 1
    //   //   if (step > numSteps) {
    //   //     clearInterval(interval)
    //   //   } else {
    //   //     var curDistance = step / numSteps * iPathLength
    //   //     var iPoint = turf.along(iPath, curDistance, 'miles')
    //   //     pSource.setData(iPoint)
    //   //     console.log(curDistance)
    //   //   }
    //   // }, timePerStep)
    // }
  }

  render () {
    const {stops, pattern, trip} = this.props
    if (!pattern || !stops) return null
    const snaps = stops.map(stop => {
      const stopPoint = point([stop.stop_lon, stop.stop_lat])
      const {snap, distTraveled} = getControlPointSnap(stopPoint, pattern.geometry.coordinates)
      return {
        ...stop,
        snap,
        distTraveled
      }
    })
    const {stop_times: stopTimes} = trip
    if (!stopTimes) return null
    const icon = divIcon({
      html: `<span class="fa-stack" style="opacity: 1.0">
              <i class="fa fa-circle fa-stack-2x" style="color: #ffffff"></i>
              <i class="fa fa-life-ring fa-stack-1x" style="color: black"></i>
            </span>`,
      className: '',
      iconSize: [24, 24]
    })
    const mmt = moment()
    // Your moment at midnight
    const midnight = mmt.clone().startOf('day')

    // Difference in minutes
    const nowInSeconds = mmt.diff(midnight, 'seconds')
    let secondsUntilNextArrival = 86400
    let nearestArrival
    let nearestDeparture
    stopTimes.forEach((st, index) => {
      const arrivalDiff = st.arrival_time - nowInSeconds
      if (arrivalDiff > 0 && arrivalDiff < secondsUntilNextArrival) {
        nearestArrival = st
        if (index > 0) {
          nearestDeparture = stopTimes[index - 1]
        }
        secondsUntilNextArrival = arrivalDiff
      }
    })
    const nextStopIndex = snaps.findIndex(stop => nearestArrival && stop.stop_id === nearestArrival.stop_id)
    const nextStop = snaps[nextStopIndex]
    if (!nextStop) return null
    let position = [nextStop.stop_lat, nextStop.stop_lon]
    let scheduledDistanceUntilNextStop
    if (nextStopIndex !== 0) {
      const previousStop = snaps[nextStopIndex - 1]
      const metersPerSecondAlongSegment = (nextStop.distTraveled - previousStop.distTraveled) / (nearestArrival.arrival_time - nearestDeparture.departure_time)
      scheduledDistanceUntilNextStop = metersPerSecondAlongSegment * secondsUntilNextArrival
      const dist = nextStop.distTraveled - scheduledDistanceUntilNextStop
      const line = lineString(pattern.geometry.coordinates)
      const pointAlong = along(line, dist, 'meters')
      position = ll.toLeaflet(pointAlong.geometry.coordinates)
    }
    return (
      <Marker
        // key={`rabbit-marker-${entity.id}`}
        icon={icon}
        zIndexOffset={1000}
        onClick={this._onClick}
        position={position}>
        <Tooltip><span>{trip.trip_id} should be here. (Scheduled at {nextStop.stop_name} for {midnight.add(nearestArrival.arrival_time, 'seconds').format('H:mm:ssa')})</span></Tooltip>
      </Marker>
    )
  }
}
