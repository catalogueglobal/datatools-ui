import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import moment from 'moment'

import { Panel, ListGroupItem, Row, Col, ButtonGroup, Button } from 'react-bootstrap'
// import CollapsibleListGroupItem from '../../common/components/collapsible-list-group-item'
import { checkEntitiesForFeeds } from '../../common/util/permissions'

const ALERT_DATE_FORMAT = 'MMM Do YYYY, h:mm:ssa'

export default class AlertPreview extends Component {
  static propTypes = {
    alert: PropTypes.object,
    publishableFeeds: PropTypes.array,
    editableFeeds: PropTypes.array,
    onEditClick: PropTypes.func,
    onDeleteClick: PropTypes.func
  }

  state = {}

  _onDeleteClick = (evt) => {
    const r = window.confirm('Are you sure you want to delete this alert?')
    if (r === true) {
      this.props.onDeleteClick(this.props.alert)
    } else {
      // do nothing
    }
  }

  _toggleDetails = () => this.setState({showDescription: !this.state.showDescription})

  _onEditClick = () => this.props.onEditClick(this.props.alert)

  render () {
    const {
      alert,
      publishableFeeds,
      editableFeeds
    } = this.props
    const {showDescription} = this.state
    const canPublish = checkEntitiesForFeeds(alert.affectedEntities, publishableFeeds)
    const canEdit = checkEntitiesForFeeds(alert.affectedEntities, editableFeeds)
    // Only approved publishers can edit published alerts.
    const editingIsDisabled = alert.published && !canPublish
      ? true
      : !canEdit

    // if user has edit rights and alert is unpublished, user can delete alert,
    // else check if they have publish rights
    const deleteIsDisabled = !editingIsDisabled && !alert.published ? false : !canPublish
    const deleteButtonMessage = alert.published && deleteIsDisabled ? 'Cannot delete because alert is published'
      : !canEdit ? 'Cannot alter alerts for other agencies' : 'Delete alert'

    const editButtonMessage = alert.published && deleteIsDisabled ? 'Cannot edit because alert is published'
      : !canEdit ? 'Cannot alter alerts for other agencies' : 'Edit alert'
    const publishedLabel = alert.published
      ? <span className='text-success' title='Published'><Icon type='check-square-o' /></span>
      : <span className='text-warning' title='Draft'><Icon type='pencil-square-o' /></span>
    const entitiesLabel = alert.affectedEntities.length
      ? <span className='text-danger' title={`${alert.affectedEntities.length} affected service(s)`}><Icon type='exclamation-triangle' /> {alert.affectedEntities.length}</span>
      : <span>General alert</span>
    const start = moment(alert.start)
    const end = moment(alert.end)
    return (
      <ListGroupItem>
        <Row>
          <Col xs={9}>
            <p style={{margin: 0}}><strong>{alert.title}</strong></p>
            <p style={{margin: 0}} className='small'>
              <span title={`Alert #${alert.id} created on ${moment(alert.createdDate).format(ALERT_DATE_FORMAT)}`}>
                #{alert.id} {publishedLabel} {entitiesLabel}
              </span>
              {' '}
              {/* From {start.fromNow()} to {end.fromNow()} */}
              <span title={`Runs from ${start.format(ALERT_DATE_FORMAT)} to ${end.format(ALERT_DATE_FORMAT)}`}>
                Lasts {moment.duration(start.diff(end)).humanize()}, starting {start.fromNow()}
              </span>
              {' '}
              <Button
                href={alert.url}
                style={{margin: 0, padding: 0}}
                title={alert.url ? alert.url : 'No alert URL specified'}
                target='_blank'
                disabled={!alert.url}
                bsStyle='link'><Icon type='link' /></Button>
              <Button
                onClick={this._toggleDetails}
                title={alert.description ? 'View description' : 'No description provided'}
                style={{margin: 0, padding: 0}}
                disabled={!alert.description}
                bsStyle='link'><Icon type='info' /></Button>
            </p>
          </Col>
          <Col xs={3}>
            <ButtonGroup bsSize='xsmall' className='pull-right'>
              <Button
                title={editButtonMessage}
                disabled={editingIsDisabled}
                onClick={this._onEditClick}>
                <Icon type='pencil' />
              </Button>
              <Button
                title={deleteButtonMessage}
                disabled={deleteIsDisabled}
                onClick={this._onDeleteClick}>
                <Icon type='remove' />
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
        <Panel
          bsClass='' // hack to remove panel style
          collapsible
          expanded={showDescription}>
          <small
            title='Alert description'
            style={{whiteSpace: 'pre-wrap'}} // render new line characters
          >{alert.description}</small>
        </Panel>
      </ListGroupItem>
    )
  }
}
