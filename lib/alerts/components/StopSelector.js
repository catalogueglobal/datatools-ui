// @flow

import React, {Component} from 'react'

import GtfsSearch from '../../gtfs/components/gtfs-search'
import type {GtfsOption} from '../../gtfs/components/gtfs-search'
import type {AlertEntity, Feed, GtfsRoute, GtfsStop} from '../../types'

type Props = {
  clearable?: boolean,
  entity: AlertEntity,
  entityUpdated: (AlertEntity, string, any, ?Feed) => void,
  feeds: Array<Feed>,
  filterByRoute?: GtfsRoute,
  minimumInput?: number,
  stop: ?GtfsStop
}

export default class StopSelector extends Component<Props> {
  _onChange = (value: GtfsOption) => {
    const {entityUpdated, entity} = this.props
    if (value) entityUpdated(entity, 'STOP', value.stop, value.agency)
    else entityUpdated(entity, 'STOP', null, null)
  }

  render () {
    const {
      stop,
      feeds,
      minimumInput,
      filterByRoute,
      clearable,
      entity
    } = this.props
    const {agency: feed} = entity
    const agencyName = feed ? feed.name : 'Unknown agency'
    return (
      <GtfsSearch
        feeds={feeds}
        limit={100}
        minimumInput={minimumInput}
        filterByRoute={filterByRoute}
        entities={['stops']}
        clearable={clearable}
        onChange={this._onChange}
        value={stop
          ? {
            stop,
            value: stop.stop_id,
            label: `${stop.stop_name} (${agencyName})`,
            agency: feed
          }
          : ''
        } />
    )
  }
}
