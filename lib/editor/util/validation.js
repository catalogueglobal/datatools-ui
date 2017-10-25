// @flow

import moment from 'moment'
import validator from 'validator'

import type {EditorTableData, Entity, Field, ScheduleException, ValidationResult} from '../../types'

/**
 * Checks that a value does not exist, i.e., it is an empty string, null,
 * undefined, or an empty array.
 */
export function doesNotExist (value: any): boolean {
  return value === '' || value === null || typeof value === 'undefined' ||
    (value && value.length === 0)
}

/**
 * Validates a single GTFS field given a GTFS entity, set of those entities,
 * and entire set of GTFS data.
 */
export function validate (
  field: Field,
  value: any,
  entities: Array<Entity>,
  entity: Entity,
  tableData: EditorTableData
): ValidationResult {
  const {inputType, required, name, condition} = field
  // ValidationResult is initialized with OK status. Default reason is set to
  // missing required field because non-errors are filtered out anyways
  const validationResult = {field: name, invalid: false, reason: 'Required field must not be empty'}
  const isRequiredButEmpty = required && doesNotExist(value)
  switch (inputType) {
    case 'GTFS_ID':
      const indices = []
      const idList = entities ? entities.map(e => e[name]) : []
      let idx = idList.indexOf(value)
      while (idx !== -1) {
        indices.push(idx)
        idx = idList.indexOf(value, idx + 1)
      }
      const isNotUnique =
        value &&
        (indices.length > 1 ||
          (indices.length > 0 && entities[indices[0]].id !== entity.id))
      if (isRequiredButEmpty || isNotUnique) {
        validationResult.invalid = true
        if (isNotUnique) {
          validationResult.reason = 'Identifier must be unique'
        }
      }
      return validationResult
    case 'TEXT':
      if (name === 'route_short_name' && !value && entity.route_long_name) {
        // if field is empty and route_short_name and long name exists, no error!
        // Note: this preempts the 'required' boolean
      } else if (
        name === 'route_long_name' &&
        !value &&
        entity.route_short_name
      ) {
        // if field is empty and route_long_name and short name exists, no error!
        // Note: this preempts the 'required' boolean
      } else {
        if (isRequiredButEmpty) {
          validationResult.invalid = true
        }
      }
      return validationResult
    case 'GTFS_TRIP':
    case 'GTFS_SHAPE':
    case 'GTFS_BLOCK':
    case 'GTFS_FARE':
    case 'GTFS_SERVICE':
      if (isRequiredButEmpty) {
        if (condition) {
          // Indicates if there is a condition to be met in order for field
          // to be required
          if (entity[condition.key] === condition.value) {
            // If service is conditionally required (e.g., custom schedule
            // exception) and the condition is satisfied (but value is empty),
            // there is an error!
            validationResult.invalid = true
          }
        } else {
          // If no condition, just set to required but empty value
          validationResult.invalid = true
        }
      }
      return validationResult
    case 'URL':
      const isNotUrl = value && !validator.isURL(value)
      if (isRequiredButEmpty || isNotUrl) {
        validationResult.invalid = true
        if (isNotUrl) {
          validationResult.reason = 'Field must contain valid URL.'
        }
      }
      return validationResult
    case 'EMAIL':
      const isNotEmail = value && !validator.isEmail(value)
      if (isRequiredButEmpty || isNotEmail) {
        validationResult.invalid = true
        if (isNotEmail) {
          validationResult.reason = 'Field must contain valid email address.'
        }
      }
      return validationResult
    case 'LATITUDE':
      const isNotLat = value > 90 || value < -90
      if (isRequiredButEmpty || isNotLat) {
        validationResult.invalid = true
        if (isNotLat) {
          validationResult.reason = 'Field must be valid latitude.'
        }
      }
      return validationResult
    case 'LONGITUDE':
      const isNotLng = value > 180 || value < -180
      if (isRequiredButEmpty || isNotLng) {
        validationResult.invalid = true
        if (isNotLng) {
          validationResult.reason = 'Field must be valid longitude.'
        }
      }
      return validationResult
    case 'TIME':
    case 'NUMBER':
      const isNotANumber = isNaN(value)
      if (isRequiredButEmpty || isNotANumber) {
        validationResult.invalid = true
        if (isNotANumber) {
          validationResult.reason = 'Field must be valid number'
        }
      }
      return validationResult
    case 'DAY_OF_WEEK_BOOLEAN':
      let hasService = false
      const DAYS_OF_WEEK: Array<string> = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ]
      for (var i = 0; i < DAYS_OF_WEEK.length; i++) {
        if (entity[DAYS_OF_WEEK[i]]) {
          hasService = true
        }
      }
      if (!hasService && name === 'monday') {
        validationResult.invalid = true
        // only add validation issue for one day of week (monday)
        validationResult.reason = 'Calendar must have service for at least one day'
      }
      return validationResult
    case 'DROPDOWN':
      if (
        isRequiredButEmpty &&
        field.options &&
        field.options.findIndex(o => o.value === '') === -1
      ) {
        validationResult.invalid = true
      }
      return validationResult
    case 'GTFS_AGENCY':
      if (
        name === 'agency_id' &&
        tableData.agency &&
        tableData.agency.length > 1
      ) {
        const missingId = doesNotExist(value)
        if (missingId) {
          validationResult.invalid = true
          validationResult.reason =
            'Field must be populated for feeds with more than one agency.'
        }
      }
      return validationResult
    case 'EXCEPTION_DATE': // a date cannot be selected more than once (for all exceptions)
      const dateMap = {}
      let exceptions: Array<ScheduleException> = []
      if (tableData.scheduleexception) {
        exceptions = [...tableData.scheduleexception]
      }
      if (entity) {
        const exceptionIndex = exceptions.findIndex(se => se.id === entity.id)
        if (exceptionIndex !== -1) {
          exceptions.splice(exceptionIndex, 1)
        }
        const castedScheduleException: ScheduleException = ((entity: any): ScheduleException)
        exceptions.push(castedScheduleException)
      }

      for (let i = 0; i < exceptions.length; i++) {
        if (exceptions[i].dates) {
          exceptions[i].dates.map(d => {
            if (typeof dateMap[d] === 'undefined') {
              dateMap[d] = []
            }
            dateMap[d].push(exceptions[i].id)
          })
        }
      }
      if (value.length === 0) {
        validationResult.field = 'dates'
        validationResult.invalid = true
      }
      // check if date already exists in this or other exceptions or if date is
      // not a valid value (according to moment)
      for (let i = 0; i < value.length; i++) {
        if (dateMap[value[i]] && dateMap[value[i]].length > 1) {
          validationResult.invalid = true
          validationResult.field = `dates-${i}`
          validationResult.reason = `Date (${value[i]}) cannot appear more than
          once for all exceptions`
        } else if (!moment(value[i], 'YYYYMMDD', true).isValid()) {
          validationResult.invalid = true
          validationResult.field = `dates-${i}`
        }
      }
      return validationResult
    case 'GTFS_ROUTE':
    case 'GTFS_STOP':
    case 'DATE':
    case 'COLOR':
    case 'POSITIVE_INT':
    case 'POSITIVE_NUM':
    case 'GTFS_ZONE':
    case 'TIMEZONE':
    case 'LANGUAGE':
    default:
      // By default, if field is required but is empty, there is an error
      validationResult.invalid = isRequiredButEmpty
      return validationResult
  }
}
