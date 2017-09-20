// @flow

import L from 'leaflet'
import {} from 'leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js'
import {PropTypes} from 'react'
import { childrenType, GridLayer } from 'react-leaflet'

export default class VectorGridLayer extends GridLayer {
  static propTypes = {
    children: childrenType,
    opacity: PropTypes.number,
    url: PropTypes.string.isRequired,
    zIndex: PropTypes.number
  }

  createLeafletElement (props: Object): Object {
    const { url, ...options } = props

    return L.vectorGrid.protobuf(url, options)
  }

  updateLeafletElement (fromProps: Object, toProps: Object) {
    super.updateLeafletElement(fromProps, toProps)
    if (toProps.url !== fromProps.url) {
      this.leafletElement.vectorGrid.protobuf(toProps.url)
    }
  }
}
