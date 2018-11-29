// @flow

import React, {Component} from 'react'
import { Panel, Row, Col, Table, Button, Glyphicon, Alert } from 'react-bootstrap'
import { browserHistory } from 'react-router'
import moment from 'moment'

import { getGtfsPlusSpec } from '../../common/util/config'
import type {FeedVersion} from '../../types'

type Props = {
  gtfsPlusDataRequested: string => void,
  gtfsplus: any,
  publishClicked: FeedVersion => void,
  user: any,
  version: FeedVersion
}

type State = {
  expanded: boolean
}

export default class GtfsPlusVersionSummary extends Component<Props, State> {
  state = { expanded: false }

  componentDidMount () {
    this.props.gtfsPlusDataRequested(this.props.version.id)
  }

  isTableIncluded (tableId: string) {
    const {tableData} = this.props.gtfsplus
    if (!tableData) return null
    return tableId in tableData ? 'Yes' : 'No'
  }

  tableRecordCount (tableId: string): ?string {
    const {tableData} = this.props.gtfsplus
    if (!tableData) return null
    if (!(tableId in tableData)) return 'N/A'
    return tableData[tableId].length.toLocaleString()
  }

  validationIssueCount (tableId: string): ?string {
    const {validation} = this.props.gtfsplus
    if (!validation) return null
    if (!(tableId in validation)) return 'None'
    return validation[tableId].length.toLocaleString()
  }

  feedStatus () {
    const {timestamp} = this.props.gtfsplus
    if (!timestamp) return null
    if (!this.gtfsPlusEdited()) return <i>GTFS+ data for this feed version has not been edited.</i>
    return <b>GTFS+ Data updated {moment(timestamp).format('MMM. DD, YYYY, h:MMa')}</b>
  }

  gtfsPlusEdited = () => (this.props.gtfsplus.timestamp !== this.props.version.fileTimestamp)

  _onClickEdit = () => {
    const {version} = this.props
    browserHistory.push(`/gtfsplus/${version.feedSource.id}/${version.id}`)
  }

  _onClickPublish = () => {
    this.props.publishClicked(this.props.version)
    this.setState({ expanded: false })
  }

  _toggleExpanded = () => {
    const {gtfsPlusDataRequested, version} = this.props
    const {expanded} = this.state
    if (!expanded) gtfsPlusDataRequested(version.id)
    this.setState({ expanded: !expanded })
  }

  render () {
    const {
      user,
      version
    } = this.props
    const { feedSource } = version
    const editingIsDisabled = !user.permissions.hasFeedPermission(feedSource.organizationId, feedSource.projectId, feedSource.id, 'edit-gtfs')
    const publishingIsDisabled = !user.permissions.hasFeedPermission(feedSource.organizationId, feedSource.projectId, feedSource.id, 'approve-gtfs')
    const header = (
      <h3>
        <Glyphicon glyph='check' /> GTFS+ for this Version
      </h3>
    )

    return (
      <Panel header={header}>
        <Row>
          <Col xs={6}>
            <Alert>{this.feedStatus()}</Alert>
          </Col>
          <Col xs={6} style={{ textAlign: 'right' }}>
            <Button
              disabled={editingIsDisabled}
              bsStyle='primary'
              onClick={this._onClickEdit}>
              <Glyphicon glyph='edit' /> Edit GTFS+
            </Button>
            {this.gtfsPlusEdited()
              ? <Button
                disabled={publishingIsDisabled}
                bsStyle='primary'
                style={{ marginLeft: '6px' }}
                onClick={this._onClickPublish}>
                <Glyphicon glyph='upload' /> Publish as New Version
              </Button>
              : null
            }
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Panel>
              <Table striped fill>
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Included?</th>
                    <th>Records</th>
                    <th>Validation Issues</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {getGtfsPlusSpec().map((table, index) => {
                    const issueCount = this.validationIssueCount(table.id)
                    return (
                      <tr
                        key={index}
                        className={+issueCount > 0 && 'warning'}
                        style={{ color: this.isTableIncluded(table.id) === 'Yes' ? 'black' : 'lightGray' }}>
                        <td>{table.name}</td>
                        <td>{this.isTableIncluded(table.id)}</td>
                        <td>{this.tableRecordCount(table.id)}</td>
                        <td>{issueCount}</td>
                        <td />
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Panel>
          </Col>
        </Row>
      </Panel>
    )
  }
}
