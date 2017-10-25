// @flow

import {List} from 'immutable'
import SortDirection from 'react-virtualized/dist/commonjs/Table/SortDirection'
import {createSelector} from 'reselect'

import {getEditorTable} from '../util'
import {validate} from '../util/validation'
import {getEntityName} from '../util/gtfs'

import type {Entity, Field, ValidationResult} from '../../types'

const getActiveEntity = (state) => state.editor.data.active.entity

const getActiveId = createSelector(
  [state => state.editor.data.active.entity],
  (entity) => entity ? entity.id : undefined
)

const getActiveComponent = (state) => state.editor.data.active.component

const getEditorTables = state => state.editor.data.tables

const getActiveTable = createSelector(
  [getActiveComponent, state => state.editor.data.tables],
  (component, tableData) => tableData[component]
)

export const getValidationErrors = createSelector(
  [ getActiveComponent, getActiveEntity, getActiveTable, getEditorTables ],
  (component, entity, entities, tableData) => {
    return getEditorTable(component) && entity
    ? getEditorTable(component).fields
      .map((field: Field, colIndex: number) =>
        validate(field, entity[field.name], entities, entity, tableData))
      // filter out any non-errors because we don't care about those in the ui
      .filter((e: ValidationResult) => e.invalid)
    : []
  }
)

const getTableSort = state => state.editor.data.sort

export const getActiveEntityList = createSelector(
  [ getActiveId, getActiveComponent, getActiveTable, getTableSort ],
  (activeId, component, entities, sort) => {
    const list = entities && entities.length
      ? entities.map((entity: Entity, index: number) => {
        const {id} = entity
        const isActive = activeId && id === activeId
        const name = getEntityName(entity) || '[Unnamed]'
        return {...entity, name, id, isActive}
      })
      : []
    // return sorted Immutable List (based on sort value from store)
    return List(list)
      .sortBy((entity: Entity) => entity[sort.key])
      .update(list =>
          sort.direction === SortDirection.DESC
            ? list.reverse()
            : list
        )
  }
)
