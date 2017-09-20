// @flow

import L from 'leaflet'
import mapboxgl from 'mapbox-gl'
import {} from 'mapbox-gl-leaflet'
import {PropTypes} from 'react'
import { GridLayer } from 'react-leaflet'

export default class MapBoxGLLayer extends GridLayer {
  static propTypes = {
    opacity: PropTypes.number,
    accessToken: PropTypes.string.isRequired,
    style: PropTypes.string,
    zIndex: PropTypes.number
  }

  createLeafletElement (props: Object): Object {
    const {accessToken} = props
    window.mapboxgl = mapboxgl
    return L.mapboxGL(props)
  }
}
