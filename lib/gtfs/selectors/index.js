// @flow

import { createSelector } from 'reselect'

import {getFeedsForPermission} from '../../common/util/permissions'
import {getActiveProject} from '../../manager/selectors'
import type {AppState} from '../../types/reducers'

const getPermissionFilter = (state: AppState) => state.gtfs.filter.permissionFilter

const getUser = (state: AppState) => state.user

export const getAllFeeds: AppState => any = createSelector(
  [ getUser, getPermissionFilter, getActiveProject ],
  (user, filter, project) => {
    return getFeedsForPermission(project, user, filter)
  }
)

export const getPublishedFeeds = createSelector(
  [ getActiveProject ],
  (activeProject) => {
    return activeProject && activeProject.feedSources
      ? activeProject.feedSources.filter(feedSource => feedSource.publishedVersionId)
      : []
  }
)

export const getActiveFeeds: AppState => any = createSelector(
  [ getAllFeeds, state => state.gtfs.filter.activeFeeds ],
  (all, active) => {
    return all.filter((feed, index) => active && active[feed.id])
  }
)

export const getActiveAndLoadedFeeds: AppState => any = createSelector(
  [ getActiveFeeds, getPublishedFeeds ],
  (active, published) => {
    return active.filter(f => f && published.findIndex(feed => feed.id === f.id) !== -1)
  }
)
