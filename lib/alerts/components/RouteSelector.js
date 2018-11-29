// @flow

import React, {Component} from 'react'

import {getRouteNameAlerts} from '../../editor/util/gtfs'
import GtfsSearch from '../../gtfs/components/gtfs-search'
import type {GtfsOption} from '../../gtfs/components/gtfs-search'
import type {AlertEntity, Feed, GtfsRoute, GtfsStop} from '../../types'

type Props = {
  clearable?: boolean,
  entity: AlertEntity,
  entityUpdated: (AlertEntity, string, any, ?Feed) => void,
  feeds: Array<Feed>,
  filterByStop?: GtfsStop,
  minimumInput?: number,
  route?: GtfsRoute
}

export default class RouteSelector extends Component<Props> {
  _onChange = (value: GtfsOption) => {
    const {entity, entityUpdated, filterByStop} = this.props
    if (value) {
      entityUpdated(entity, 'ROUTE', value.route, value.agency)
    } else if (value == null) {
      if (filterByStop) {
        entityUpdated(entity, 'ROUTE', null, entity.agency)
      } else {
        entityUpdated(entity, 'ROUTE', null, null)
      }
    }
  }

  render () {
    const {route, feeds, minimumInput, filterByStop, clearable, entity} = this.props
    const {agency: feed} = entity
    const agencyName = feed ? feed.name : 'Unknown agency'
    const routeName = route
      ? getRouteNameAlerts(route) || '[no name]'
      : '[route not found!]'
    const value = route
      ? {
        route,
        value: route.route_id,
        label: `${routeName} (${agencyName})`,
        agency: feed
      }
      : ''
    return (
      <GtfsSearch
        feeds={feeds}
        limit={100}
        minimumInput={minimumInput}
        filterByStop={filterByStop}
        clearable={clearable}
        entities={['routes']}
        onChange={this._onChange}
        value={value} />
    )
  }
}
