// @flow

import React, {Component} from 'react'
import moment from 'moment'
import { Grid, Row, Col, Glyphicon } from 'react-bootstrap'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'
import { Link, browserHistory } from 'react-router'

import {getComponentMessages, isExtensionEnabled} from '../../common/util/config'
import type {Coordinate, Feed, Project} from '../../types'

import PublicPage from './PublicPage'
import RegionSearch from './RegionSearch'
import FeedsMap from './FeedsMap'

type Props = {
  onComponentMount: Props => void,
  projects: Array<Project>
}

type State = {
  bounds?: ?[Coordinate, Coordinate],
  position?: ?Coordinate
}

export default class PublicFeedsViewer extends Component<Props, State> {
  state = {}

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  _onChangeRegion = (evt: ?{feed?: Feed, region?: any}) => {
    if (evt && evt.region) {
      this.setState({
        position: [evt.region.lat, evt.region.lon],
        bounds: [[evt.region.north, evt.region.east], [evt.region.south, evt.region.west]]
      })
    }
    if (evt && evt.feed) {
      browserHistory.push('/public/feed/' + evt.feed.id)
    } else if (evt == null) {
      this.setState({position: null, bounds: null})
    }
  }

  _onFeedClick = (feedId: string) => browserHistory.push('/public/feed/' + feedId)

  render () {
    if (!this.props.projects) {
      return <PublicPage />
    }
    const feeds = []
    return (
      <PublicPage ref='publicPage'>
        <Grid>
          <Row>
            <Col xs={12} sm={6} md={4}>
              <RegionSearch
                feeds={feeds}
                limit={100}
                entities={['regions', 'feeds']}
                minimumInput={0}
                bsSize='large'
                clearable
                onChange={this._onChangeRegion} />
            </Col>
          </Row>
        </Grid>
        <FeedsMap
          projects={this.props.projects}
          onFeedClick={this._onFeedClick}
          bounds={this.state.bounds} />
        <Grid>
          <Row>
            <Col xs={12}>
              {isExtensionEnabled('mtc')
                ? null
                : <PublicFeedsTable projects={this.props.projects} />
              }
            </Col>
          </Row>
        </Grid>
      </PublicPage>
    )
  }
}

class PublicFeedsTable extends Component<{}> {
  messages = getComponentMessages('PublicFeedsTable')

  feedFormat (cell, row) {
    return cell ? <Link to={'/public/feed/' + row.id}>{cell}</Link> : ''
  }

  dateFormat (cell, row) {
    return cell ? moment(cell).format('MMMM Do YYYY, h:mm a') : ''
  }

  urlFormat (cell, row) {
    return cell ? <a href={cell}><Glyphicon glyph='new-window' /></a> : ''
  }

  dateSort (a, b, order) {
    return b.lastUpdated - a.lastUpdated
  }
  render () {
    const feeds = []
    return (
      <BootstrapTable
        data={feeds}
        pagination
        striped
        hover
        search>
        <TableHeaderColumn isKey dataSort hidden dataField='id'>Feed ID</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='name' dataFormat={this.feedFormat}>{this.messages('name')}</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='region'>{this.messages('region')}</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='state'>{this.messages('stateProvince')}</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='country'>{this.messages('country')}</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='lastUpdated' sortFunc={this.dateSort}>{this.messages('lastUpdated')}</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='lastUpdated' hidden>last_update</TableHeaderColumn>
        <TableHeaderColumn dataField='url' dataFormat={this.urlFormat}>{this.messages('link')}</TableHeaderColumn>
      </BootstrapTable>
    )
  }
}
