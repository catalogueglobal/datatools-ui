// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { ButtonGroup, Tooltip, OverlayTrigger, Button } from 'react-bootstrap'

import {componentToText, entityIsNew} from '../util/objects'
import type {Entity, Feed} from '../../types'
import type {ImmutableList} from '../selectors/index'

type Props = {
  activeComponent: string,
  activeEntity: Entity,
  cloneEntity: (string, string, ?number) => void,
  deleteEntity: (string, string, ?number, ?string) => void,
  entities: Array<Entity>,
  feedSource: Feed,
  fromIndex: ?number,
  list: ImmutableList,
  newGtfsEntity: (string, string) => void,
  setActiveEntity: (string, string) => void,
  showConfirmModal: ({body: string, onConfirm: () => void, title: string}) => void,
  toIndex: ?number,
  updateIndexes: (?number, ?number) => void
}

export default class EntityListButtons extends Component<Props> {
  _mergeEntities = () => {
    // TODO: add merge routes action
    window.alert('Merge routes feature not yet supported!')
  }

  _onClickClone = () => {
    const {activeComponent, activeEntity, cloneEntity, feedSource} = this.props
    cloneEntity(feedSource.id, activeComponent, activeEntity.id)
  }

  _onClickDelete = () => {
    const {
      activeComponent,
      activeEntity,
      deleteEntity,
      feedSource,
      fromIndex,
      list,
      setActiveEntity,
      showConfirmModal,
      toIndex,
      updateIndexes
    } = this.props
    // let fromIndex, toIndex
    const type = componentToText(activeComponent)
    if (activeEntity) {
      // Show modal and delete on confirmation
      showConfirmModal({
        title: `Delete ${type}?`,
        body: `Are you sure you want to delete this ${type}?`,
        onConfirm: () => {
          deleteEntity(feedSource.id, activeComponent, activeEntity.id)
          updateIndexes(fromIndex, toIndex)
          setActiveEntity(feedSource.id, activeComponent)
        }
      })
    } else if (typeof fromIndex === 'number' && typeof toIndex === 'number') {
      showConfirmModal({
        // FIXME: fix plural component text
        title: `Delete ${+toIndex - +fromIndex} ${type}s?`,
        body: `Are you sure you want to delete these ${toIndex - fromIndex} ${type}s?`,
        onConfirm: () => {
          for (var i = 0; i < list.length; i++) {
            if (list[i].isSelected) {
              // Delete selected entity
              deleteEntity(feedSource.id, activeComponent, list[i].id)
            }
          }
          updateIndexes(fromIndex, toIndex)
          setActiveEntity(feedSource.id, activeComponent)
        }
      })
    }
  }

  _onClickNew = () => {
    const {activeComponent, feedSource, newGtfsEntity} = this.props
    newGtfsEntity(feedSource.id, activeComponent)
  }

  render () {
    const {
      activeComponent,
      activeEntity,
      entities,
      fromIndex,
      toIndex
    } = this.props
    return (
      <div>
        <ButtonGroup
          className='pull-right'>
          {activeComponent === 'route'
            ? <OverlayTrigger
              placement='bottom'
              overlay={<Tooltip id={`merge-route`}>Merge routes</Tooltip>}>
              <Button
                bsSize='small'
                disabled={!(typeof fromIndex === 'number' && typeof toIndex === 'number') || toIndex - fromIndex !== 1}
                onClick={this._mergeEntities}>
                <Icon type='compress' />
              </Button>
            </OverlayTrigger>
            : null
          }
          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id={`duplicate-${activeComponent}`}>
                Duplicate {componentToText(activeComponent)}
              </Tooltip>
            }>
            <Button
              bsSize='small'
              data-test-id={`clone-${activeComponent}-button`}
              disabled={!activeEntity}
              onClick={this._onClickClone}>
              <Icon type='clone' />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id={`delete-${activeComponent}`}>
                Delete {componentToText(activeComponent)}
              </Tooltip>
            }>
            <Button
              bsSize='small'
              data-test-id={`delete-${activeComponent}-button`}
              disabled={!activeEntity && typeof fromIndex === 'undefined'}
              onClick={this._onClickDelete}>
              <Icon type='trash' />
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
        {activeComponent === 'stop'
          ? <span className='small'>Right-click map for new stop</span>
          : <Button
            bsSize='small'
            data-test-id={`new-${activeComponent}-button`}
            disabled={entities && entities.findIndex(entityIsNew) !== -1}
            onClick={this._onClickNew}>
            <Icon style={{margin: '-5px'}} type='plus' />
            {' '}
            New {componentToText(activeComponent)}
          </Button>
        }
      </div>
    )
  }
}
