// @flow

import React, {Component} from 'react'
import {
  Panel,
  Label,
  ListGroup,
  ListGroupItem,
  Row,
  Col,
  Button
} from 'react-bootstrap'

import { isExtensionEnabled } from '../../common/util/config'
import GtfsSearch from '../../gtfs/components/gtfs-search'
import type {Alert, AlertEntity, Feed} from '../../types'

import AffectedEntity from './AffectedEntity'

type Props = {
  activeFeeds: Array<Feed>,
  alert: Alert,
  entityUpdated: (AlertEntity, string, any) => void,
  newEntityId: number,
  onAddEntityClick: (string, any, ?Feed, number) => void,
  onDeleteEntityClick: any => void,
  sortedFeeds: Array<Feed>
}

export default class AffectedServices extends Component<Props> {
  _onAddMode = () => {
    const {newEntityId, onAddEntityClick, sortedFeeds} = this.props
    // default value is Tram
    onAddEntityClick(
      'MODE',
      {gtfsType: 0, name: 'Tram/LRT'},
      sortedFeeds[0],
      newEntityId
    )
  }

  _onAddAgency = () => {
    const {newEntityId, onAddEntityClick, sortedFeeds} = this.props
    // default value is first entry
    onAddEntityClick('AGENCY', sortedFeeds[0], null, newEntityId)
  }

  _onSelectEntity = (value: any) => {
    const {onAddEntityClick, newEntityId} = this.props
    if (typeof value !== 'undefined' && value !== null) {
      if (value.stop) {
        onAddEntityClick('STOP', value.stop, value.agency, newEntityId)
      } else if (value.route) {
        onAddEntityClick('ROUTE', value.route, value.agency, newEntityId)
      }
    }
  }

  render () {
    const {
      sortedFeeds,
      alert,
      activeFeeds,
      onDeleteEntityClick,
      entityUpdated
    } = this.props
    return (
      <Panel
        header={<ServicesHeader entities={alert.affectedEntities} />}>
        <ListGroup fill>
          <ListGroupItem>
            <Row>
              <Col xs={5}>
                <Button
                  style={{marginRight: '5px'}}
                  onClick={this._onAddAgency}>
                  Add Agency
                </Button>
                {!isExtensionEnabled('mtc') &&
                  <Button
                    onClick={this._onAddMode}>
                    Add Mode
                  </Button>
                }
              </Col>
              <Col xs={7}>
                <GtfsSearch
                  feeds={activeFeeds}
                  placeholder='Add stop/route'
                  limit={100}
                  entities={['stops', 'routes']}
                  clearable
                  onChange={this._onSelectEntity} />
              </Col>
            </Row>
          </ListGroupItem>
          {alert.affectedEntities
            .sort((a, b) => b.id - a.id) // reverse sort by entity id
            .map((entity) => (
              <AffectedEntity
                entity={entity}
                key={entity.id}
                activeFeeds={activeFeeds}
                feeds={sortedFeeds}
                onDeleteEntityClick={onDeleteEntityClick}
                entityUpdated={entityUpdated} />
            ))}
        </ListGroup>
      </Panel>
    )
  }
}

const entityTypes = [
  {
    singular: 'agency',
    plural: 'agencies'
  },
  {
    singular: 'route',
    plural: 'routes'
  },
  {
    singular: 'stop',
    plural: 'stops'
  },
  {
    singular: 'mode',
    plural: 'modes'
  }
]

class ServicesHeader extends Component<{entities: Array<AlertEntity>}> {
  render () {
    const {entities} = this.props
    const summary = entityTypes
      .map(t => {
        const count = entities.filter(e => e.type === t.singular.toUpperCase()).length
        return count
          ? <span key={t.singular}> <Label
            bsStyle={t.singular === 'agency' || t.singular === 'mode'
              ? 'warning'
              : 'default'
            }>
            {`${count} ${count > 1 ? t.plural : t.singular}`}
          </Label> </span>
          : null
      })
      .filter(c => c !== null)
    return (
      <span>
        <b>Alert applies to:</b>{' '}
        {summary.length ? summary : <span>[make selection below]</span>}
      </span>
    )
  }
}
