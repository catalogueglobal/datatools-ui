// @flow

import objectPath from 'object-path'

import type {Feed} from '../../types'

import {getConfigProperty} from './config'

export function getFeed (feeds: ?Array<Feed>, id: string): ?Feed {
  // console.log(feeds, id)
  // TODO: move use_extension to extension enabled??
  const useMtc = getConfigProperty('modules.gtfsapi.use_extension') === 'mtc'
  const feed = feeds
    ? feeds.find(
      feed =>
        useMtc
          ? objectPath.get(feed, 'externalProperties.MTC.AgencyId') === id
          : feed.id === id
    )
    : null
  return feed
}

export function getFeedId (feed: ?Feed): ?string {
  const useMtc = getConfigProperty('modules.gtfsapi.use_extension') === 'mtc'
  return !feed
    ? null
    : useMtc ? objectPath.get(feed, 'externalProperties.MTC.AgencyId') : feed.id
}

function getRtdApi (): ?string {
  if (getConfigProperty('modules.alerts.use_extension') === 'mtc') {
    return getConfigProperty('extensions.mtc.rtd_api')
  }
  return null
}

export function getAlertsUrl (): string {
  const rtdApi = getRtdApi()
  return rtdApi ? rtdApi + '/ServiceAlert' : '/api/manager/secure/alerts'
}

export function getSignConfigUrl (): string {
  const rtdApi = getRtdApi()
  return rtdApi
    ? rtdApi + '/DisplayConfiguration'
    : '/api/manager/secure/displays'
}

export function getDisplaysUrl (): string {
  const rtdApi = getRtdApi()
  return rtdApi
    ? rtdApi + '/Display'
    : '/api/manager/secure/displays'
}
