// @flow

import {secondsAfterMidnightToHHMM} from '../gtfs'

describe('lib > common > util > gtfs', () => {
  describe('> secondsAfterMidnightToHHMM', () => {
    describe('valid times', () => {
      it('should parse value 0', () => {
        expect(secondsAfterMidnightToHHMM(0)).toEqual('00:00:00')
      })

      it('should parse a value in the day', () => {
        expect(secondsAfterMidnightToHHMM(12345)).toEqual('03:25:45')
      })

      it('should parse a value after midnight', () => {
        expect(secondsAfterMidnightToHHMM(99999)).toEqual('27:46:39')
      })

      it('should parse a value 2 days in the future', () => {
        expect(secondsAfterMidnightToHHMM(222222)).toEqual('61:43:42')
      })

      it('should parse a value below 0', () => {
        expect(secondsAfterMidnightToHHMM(-1)).toEqual('23:59:59 (previous day)')
      })
    })

    describe('invalid times', () => {
      it('should not parse null', () => {
        expect(secondsAfterMidnightToHHMM(null)).toEqual('')
      })
    })
  })
})
