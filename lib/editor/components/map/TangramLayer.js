// @flow

import L from 'leaflet'
import {} from 'leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js'
import Tangram from 'tangram'
import {PropTypes} from 'react'
import { childrenType, GridLayer } from 'react-leaflet'

export default class TangramLayer extends GridLayer {
  static propTypes = {
    children: childrenType,
    opacity: PropTypes.number,
    url: PropTypes.string.isRequired,
    zIndex: PropTypes.number
  }

  createLeafletElement (props: Object): Object {
    // const { url, ...options } = props

    return Tangram.leafletLayer(props)
  }

  updateLeafletElement (fromProps: Object, toProps: Object) {
    super.updateLeafletElement(fromProps, toProps)
    if (toProps.scene !== fromProps.scene) {
      this.leafletElement.leafletLayer(toProps)
    }
  }
}
