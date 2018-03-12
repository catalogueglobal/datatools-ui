import { createSelector } from 'reselect'

const getActiveTable = createSelector(
  [ state => state.gtfsplus.activeTableId, state => state.gtfsplus.tableData ],
  (tableId, tableData) => {
    return tableData && tableData[tableId]
  }
)

const getTableValidation = state => state.gtfsplus.validation[state.gtfsplus.activeTableId] || []

export const getFilteredRows = createSelector(
  [ state => state.gtfsplus.visibility, getActiveTable, getTableValidation ],
  (visibility, table, validation) => {
    switch (visibility) {
      case 'all':
        return table
      case 'validation':
        return table
          ? table.filter(record => (validation.find(v => v.rowIndex === record.origRowIndex)))
          : []
    }
  }
)

export const getFilteredPageCount = createSelector(
  [ state => state.gtfsplus.recordsPerPage, getFilteredRows ],
  (recordsPerPage, rows) => {
    const numRows = rows ? rows.length : 0
    return Math.ceil(numRows / recordsPerPage)
  }
)

export const getVisibleRows = createSelector(
  [ state => state.gtfsplus.currentPage, state => state.gtfsplus.recordsPerPage, getFilteredRows ],
  (currentPage, recordsPerPage, rows) => {
    return rows
      ? rows.slice((currentPage - 1) * recordsPerPage,
          Math.min(currentPage * recordsPerPage, rows.length))
      : []
  }
)
