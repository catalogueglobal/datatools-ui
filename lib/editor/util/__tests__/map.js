/* globals describe, expect, it */

import nock from 'nock'

import {recalculateShape} from '../map'

const fixtureControlPoints = require('./fixtures/test-control-points.json')
const followStreets = true
const patternShape = require('./fixtures/test-pattern-shape.json')

describe('editor > util > map >', () => {
  describe('recalculateShape >', () => {
    function makeTestCase ({
      controlPoints = fixtureControlPoints,
      editType,
      index,
      mapzenResponeFile,
      newPoint,
      resultCoordsCanBeNull = false,
      title
    }) {
      return it(
        title,
        async () => {
          // setup nock
          if (mapzenResponeFile) {
            nock('https://valhalla.mapzen.com')
              .get(/^\/route\?json.*/)
              .reply(200, require(mapzenResponeFile))
          }

          const result = await recalculateShape({
            controlPoints,
            editType,
            index,
            followStreets,
            newPoint,
            patternShape
          })

          expect(result).toMatchSnapshot()
          const {coordinates} = result
          if (!resultCoordsCanBeNull) {
            expect(coordinates.length).toBeGreaterThan(0)
            coordinates.forEach(coord => {
              expect(coord.length).toBe(2)
              expect(Math.abs(coord[0])).toBeLessThanOrEqual(180)
              expect(Math.abs(coord[1])).toBeLessThanOrEqual(90)
            })
          }
        }
      )
    }

    describe('updating >', () => {
      makeTestCase({
        editType: 'update',
        index: 0,
        mapzenResponeFile: './fixtures/mapzen-response-update-first-stop.json',
        newPoint: [-77.92553, 42.08666],
        title: 'should update the first stop'
      })

      makeTestCase({
        editType: 'update',
        index: 4,
        mapzenResponeFile: './fixtures/mapzen-response-update-last-stop.json',
        newPoint: [-77.92262, 42.09828],
        title: 'should update the last stop'
      })

      makeTestCase({
        editType: 'update',
        index: 3,
        mapzenResponeFile: './fixtures/mapzen-response-update-middle-control-point.json',
        newPoint: [-77.92382, 42.09182],
        title: 'should update a point in the middle of the control points'
      })
    })

    describe('deleting >', () => {
      makeTestCase({
        editType: 'delete',
        index: 0,
        title: 'should delete the first stop'
      })

      makeTestCase({
        editType: 'delete',
        index: 4,
        title: 'should delete the last stop'
      })

      makeTestCase({
        controlPoints: require('./fixtures/test-control-points-with-extra-point-at-end.json'),
        editType: 'delete',
        index: 2,
        resultCoordsCanBeNull: true,
        title: 'should delete the last stop when there are control points after the last stop'
      })

      makeTestCase({
        editType: 'delete',
        index: 3,
        mapzenResponeFile: './fixtures/mapzen-response-delete-middle-control-point.json',
        title: 'should delete a point in the middle of the control points'
      })
    })
  })
})
