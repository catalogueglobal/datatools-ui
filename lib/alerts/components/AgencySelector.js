// @flow

import React, {Component} from 'react'
import {FormControl} from 'react-bootstrap'

import {getFeed, getFeedId} from '../../common/util/modules'
import type {AlertEntity, Feed} from '../../types'

type Props = {
  entity: AlertEntity,
  entityUpdated: (AlertEntity, string, any) => void,
  feeds: Array<Feed>
}

export default class AgencySelector extends Component<Props> {
  _onSelect = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const {entity, entityUpdated, feeds} = this.props
    const feed = getFeed(feeds, evt.target.value)
    entityUpdated(entity, 'AGENCY', feed)
  }

  render () {
    const {feeds, entity} = this.props
    return (
      <div>
        <FormControl
          componentClass='select'
          value={entity.agency && getFeedId(entity.agency)}
          onChange={this._onSelect}>
          {feeds.map((feed) => (
            <option
              key={getFeedId(feed) || feed.id}
              value={getFeedId(feed) || feed.id}>
              {feed.name}
            </option>
          ))}
        </FormControl>
      </div>
    )
  }
}
