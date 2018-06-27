// @flow

import React, {Component} from 'react'
import {Checkbox} from 'react-bootstrap'

type Props = {
  showAllRoutesOnMap: boolean,
  toggleShowAllRoutesOnMap: () => void
}

export default class ShowAllRoutesOnMapFilter extends Component<Props> {
  render () {
    const {
      showAllRoutesOnMap,
      toggleShowAllRoutesOnMap
    } = this.props

    return (
      <Checkbox
        checked={showAllRoutesOnMap}
        onChange={toggleShowAllRoutesOnMap}
        >
        Show all routes
      </Checkbox>
    )
  }
}
