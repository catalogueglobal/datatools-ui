// @flow

import Icon from '@conveyal/woonerf/components/icon'
import moment from 'moment'
import React, {Component} from 'react'
import {Button, ListGroupItem} from 'react-bootstrap'
import area from 'turf-area'
import bboxPoly from 'turf-bbox-polygon'

import {getConfigProperty, isExtensionEnabled} from '../../../common/util/config'
import type {FeedVersion, Bounds, Feed} from '../../../types'
import type {ManagerUserState} from '../../../types/reducers'

import VersionDateLabel from './VersionDateLabel'

type Props = {
  feedSource: Feed,
  publishFeedVersion: FeedVersion => void,
  user: ManagerUserState,
  version: FeedVersion
}

const dateFormat = 'MMM. DD, YYYY'

export default class FeedVersionDetails extends Component<Props> {
  getBoundsArea (bounds: Bounds): number {
    if (!bounds) return 0
    const poly = bboxPoly([bounds.west, bounds.south, bounds.east, bounds.east])
    return poly ? area(poly) : 0
  }

  _onClickPublish = () => this.props.publishFeedVersion(this.props.version)

  render () {
    const {feedSource, user, version} = this.props
    const {validationSummary: summary} = version
    // We must check the version ID against the feed source in props (not the
    // feed source nested underneath version) because this is the only place the
    // published version is updated.
    const isPublished = version.namespace === feedSource.publishedVersionId
    const userCanManageFeed = user.permissions &&
      user.permissions.hasFeedPermission(
        version.feedSource.organizationId,
        version.feedSource.projectId,
        version.feedSource.id,
        'manage-feed'
      )

    return (
      <ListGroupItem>
        <h4>
          {isExtensionEnabled('mtc')
            ? <Button
              disabled={isPublished || version.processing || !userCanManageFeed}
              className='pull-right'
              bsStyle={isPublished ? 'success' : 'warning'}
              onClick={this._onClickPublish}>
              {isPublished
                ? <span><Icon type='check-circle' /> Published</span>
                : version.processing
                  ? <span>Processing...</span>
                  : <span>Publish to MTC</span>
              }
            </Button>
            : null
          }
          <span>
            <Icon type='calendar' />{' '}
            Valid from {moment(summary.startDate).format(dateFormat)}{' '}
            to {moment(summary.endDate).format(dateFormat)}
          </span>
          {' '}
          <VersionDateLabel version={version} />
        </h4>
        <p>
          {summary && summary.avgDailyRevenueTime
            ? <span>
              <Icon type='clock-o' />
              {' '}
              {Math.floor(summary.avgDailyRevenueTime / 60 / 60 * 100) / 100}{' '}
              hours daily service (Tuesday)
            </span>
            : null
          }
          {summary && summary.bounds && getConfigProperty('application.dev')
            ? <span>
              <Icon type='globe' />
              {' '}
              {this.getBoundsArea(summary.bounds)} square meters
            </span>
            : null
          }
        </p>
      </ListGroupItem>
    )
  }
}
