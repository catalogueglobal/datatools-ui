import update from 'react-addons-update'

import {constructNewGtfsPlusRow} from '../util'

const defaultState = {
  activeTableId: 'realtime_routes',
  feedVersionId: null,
  timestamp: null,
  tableData: null,
  validation: {},
  gtfsEntityLookup: {},
  visibility: 'all',
  currentPage: 1,
  pageCount: 0,
  recordsPerPage: 25
}

const gtfsplus = (state = defaultState, action) => {
  switch (action.type) {
    case 'CLEAR_GTFSPLUS_CONTENT':
      return defaultState
    case 'SET_CURRENT_GTFSPLUS_PAGE':
      return update(state, {
        currentPage: {$set: action.payload.newPage}
      })
    case 'SET_ACTIVE_GTFSPLUS_TABLE':
      const tableRows = state.tableData[action.payload.activeTableId] || []
      return update(state, {
        activeTableId: {$set: action.payload.activeTableId},
        currentPage: {$set: 1},
        pageCount: {$set: Math.ceil(tableRows.length / state.recordsPerPage)}
      })
    case 'SET_GTFSPLUS_VISIBILITY':
      return update(state, {
        visibility: {$set: action.payload.visibility},
        currentPage: {$set: 1}
      })
    case 'RECEIVE_GTFSPLUS_CONTENT':
      const newTableData = {}
      for (let i = 0; i < action.filenames.length; i++) {
        // split file into lines
        const lines = action.fileContent[i].split(/\r\n|\r|\n/g)
        if (lines.length < 2) continue
        const fields = lines[0].split(',')
        const COLUMN_REGEX = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
        const tableName = action.filenames[i].split('.')[0]
        newTableData[tableName] = lines.slice(1)
          .filter(line => line.split(COLUMN_REGEX).length === fields.length)
          .map((line, rowIndex) => {
            const values = line.split(COLUMN_REGEX)
            // add origRowIndex for referencing validation issues and rowIndex
            // for use with adding/deleting rows
            const rowData = { origRowIndex: rowIndex, rowIndex }
            for (let f = 0; f < fields.length; f++) {
              rowData[fields[f]] = values[f]
            }
            return rowData
          })
      }
      return update(state, {
        feedVersionId: {$set: action.feedVersionId},
        timestamp: {$set: action.timestamp},
        tableData: {$set: newTableData},
        pageCount: {$set: Math.ceil(newTableData.length / state.recordsPerPage)}
      })
    case 'ADD_GTFSPLUS_ROW':
      const newRow = constructNewGtfsPlusRow(action.payload.tableId)
      const tableExists = action.payload.tableId in state.tableData
      // add rowIndex for use with tracking row for deletion/updating values
      newRow.rowIndex = tableExists
        ? state.tableData[state.activeTableId].length
        : 0
      // create this table if it doesn't already exist
      if (!tableExists) {
        return update(state,
          {tableData:
            {$merge: {[action.payload.tableId]: [newRow]}}
          }
        )
      }
      const pageCountPostAdd = Math.ceil((state.tableData[state.activeTableId].length + 1) / state.recordsPerPage)
      // Anytime a user adds a new row, the expected behavior would be to see that row,
      // so we set the current page to page count if it is less than the new count
      const currentPagePostAdd = pageCountPostAdd > state.currentPage
        ? pageCountPostAdd
        : state.currentPage
      // otherwise, add it to the exising table
      return update(state, {
        tableData: {
          [action.payload.tableId]: {
            $push: [newRow]
          }
        },
        pageCount: {$set: pageCountPostAdd},
        currentPage: {$set: currentPagePostAdd}
      })
    case 'UPDATE_GTFSPLUS_FIELD':
      return update(state, {
        tableData: {
          [action.payload.tableId]: {
            [action.payload.rowIndex]: {
              [action.payload.fieldName]: {
                $set: action.payload.newValue
              }
            }
          }
        }
      })
    case 'DELETE_GTFSPLUS_ROW':
      const deleteTable = state.tableData[action.tableId]
      // update rowIndex for rows after deleted row (to account for index offset)
      const recordsAfterDeletedRow = deleteTable.slice(action.rowIndex + 1)
      recordsAfterDeletedRow.map(r => {
        r.rowIndex = r.rowIndex - 1
      })
      const newTable = [
        ...deleteTable.slice(0, action.rowIndex),
        ...recordsAfterDeletedRow
      ]
      const pageCountPostDelete = Math.ceil(newTable.length / state.recordsPerPage)
      const currentPagePostDelete = state.currentPage > pageCountPostDelete
        ? pageCountPostDelete
        : state.currentPage
      return update(state, {
        tableData: {
          [action.tableId]: {
            $set: newTable
          }
        },
        pageCount: {$set: pageCountPostDelete},
        currentPage: {$set: currentPagePostDelete}
      })
    case 'RECEIVE_GTFS_PLUS_ENTITIES':
      const getType = function (entity) {
        if (entity.hasOwnProperty('route_id')) return 'route'
        if (entity.hasOwnProperty('stop_id')) return 'stop'
      }
      const newLookupEntries = {}
      for (const entity of action.gtfsEntities) {
        const type = getType(entity)
        const key = type + '_' + entity[type + '_id']
        newLookupEntries[key] = entity
      }

      return update(state, {
        gtfsEntityLookup: {
          $merge: newLookupEntries
        }
      })
    case 'RECEIVE_GTFSPLUS_VALIDATION':
      const validationTable = {}
      for (const issue of action.validationIssues) {
        if (!(issue.tableId in validationTable)) {
          validationTable[issue.tableId] = []
        }
        validationTable[issue.tableId].push(issue)
      }
      return update(state, {
        validation: {
          $set: validationTable
        }
      })

    default:
      return state
  }
}

export default gtfsplus
