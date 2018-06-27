// @flow

import {getEntityName} from '../gtfs'

describe('editor > util > gtfs', () => {
  describe('getEntityName', () => {
    describe('routes', () => {
      it('should get name for route with no names', () => {
        // cast input to any flow type cause I'm lazy and don't want to
        // add all variables when they aren't needed
        expect(getEntityName(({
          route_id: '1'
        }: any))).toEqual('[no name]')
      })

      it('should get name for route with just short name', () => {
        // cast input to any flow type cause I'm lazy and don't want to
        // add all variables when they aren't needed
        expect(getEntityName(({
          route_id: '1',
          route_short_name: 'short name'
        }: any))).toEqual('short name')
      })

      it('should get name for route with just long name', () => {
        // cast input to any flow type cause I'm lazy and don't want to
        // add all variables when they aren't needed
        expect(getEntityName(({
          route_id: '1',
          route_long_name: 'long name'
        }: any))).toEqual('long name')
      })

      it('should get name for route with both short and long name', () => {
        // cast input to any flow type cause I'm lazy and don't want to
        // add all variables when they aren't needed
        expect(getEntityName(({
          route_id: '1',
          route_long_name: 'long name',
          route_short_name: 'short name'
        }: any))).toEqual('short name - long name')
      })
    })
  })
})
