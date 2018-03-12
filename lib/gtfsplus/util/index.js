// @flow

import {getGtfsPlusSpec} from '../../common/util/config'

export function constructNewGtfsPlusRow (tableId: string): { [string]: null } {
  const table = getGtfsPlusSpec()
    .find(t => t.id === tableId)
  if (typeof table === 'undefined') {
    throw new Error(`Could not find table '${tableId}' in GTFS+ spec`)
  }
  const rowData = {}
  for (const field of table.fields) {
    rowData[field.name] = null
  }
  return rowData
}
