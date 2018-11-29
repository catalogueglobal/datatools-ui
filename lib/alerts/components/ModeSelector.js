// @flow

import React, {Component} from 'react'
import { FormControl } from 'react-bootstrap'

import {modes} from '../util'
import type {AlertEntity} from '../../types'

type Props = {
  entity: AlertEntity,
  entityUpdated: (AlertEntity, string, any) => void,
}

export default class ModeSelector extends Component<Props> {
  _onChange = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.entityUpdated(this.props.entity, 'MODE', this.getMode(evt.target.value))

  getMode = (routeType: string) => modes.find((mode) => mode.gtfsType === +routeType)

  render () {
    const {entity} = this.props
    return (
      <div>
        <FormControl
          componentClass='select'
          value={entity.mode ? entity.mode.gtfsType : 0}
          onChange={this._onChange}>
          {modes.map((mode, i) => (
            <option key={i} value={mode.gtfsType}>{mode.name}</option>
          ))}
        </FormControl>
      </div>
    )
  }
}
