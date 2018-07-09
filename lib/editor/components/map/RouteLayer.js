/**
a layer for drawing route alignments, adapted from StopLayer
*/
import { GridLayer } from 'react-leaflet'
import { Canvas } from 'leaflet'

const MIN_ZOOM = 1 // don't draw stops below this zoom

export default class RouteLayer extends GridLayer {
  static defaultProps = {
    minZoom: MIN_ZOOM
  }

  componentWillMount () {
    super.componentWillMount()
    this.leafletElement = new Canvas({
      // retina: '@2x',
      detectRetina: true
    })
    this.leafletElement.drawTile = this.drawTile
    // this.leafletElement.on('click', this.onClick.bind(this))
  }

  drawTile = (cvs, tilePt, z) => {
    const tileLength = 256
    if (z < this.props.minZoom) return // don't draw every transit stop in a country

    const ctx = cvs.getContext('2d')
    ctx.strokeStyle = '#888'

    // get the bounds
    // let topLeft = this.props.map.unproject([tilePt.x * tileLength, tilePt.y * tileLength], z)
    // let brPoint = point([tilePt.x + 1, tilePt.y + 1])
    // let botRight = this.props.map.unproject([brPoint.x * tileLength, brPoint.y * tileLength], z)

    // console.log('tile', tilePt)
    this.props.tripPatterns.forEach((p) => {
      if (!p.latLngs) return
      // console.log(p);
      for (let i = 0; i < p.latLngs.length - 1; i++) {
        const p1 = p.latLngs[i]
        const p2 = p.latLngs[i + 1]

        // console.log('pts', p1, p2)
        // console.log(this.props.map.project(p1, z));

        const pr1 = this.props.map.project(p1, z)
        const pr2 = this.props.map.project(p2, z)

        ctx.beginPath()
        ctx.moveTo(pr1.x %= tileLength, pr1.y %= tileLength)
        ctx.lineTo(pr2.x %= tileLength, pr2.y %= tileLength)
        ctx.stroke()
      }
    })
    // find relevant stops
    /* this.props.stops
      .filter((s) => s.stop_lat < topLeft.lat && s.stop_lat > botRight.lat && s.stop_lon > topLeft.lng && s.stop_lon < botRight.lng)
      .forEach((s) => {
        // get coordinates
        // lat first for leaflet, every so often Lineland seems like a good idea
        // http://www.gutenberg.org/ebooks/97
        let { x, y } = this.props.map.project([s.stop_lat, s.stop_lon], z)

        // we know they're in the current tile so we can be lazy and just modulo
        x %= tileLength
        y %= tileLength

        // center it up
        x -= 1
        y -= 1

        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.stroke()
      }) */
  }
}
