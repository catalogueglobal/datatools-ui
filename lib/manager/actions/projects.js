// @flow

import {createAction, type ActionType} from 'redux-actions'
import {browserHistory} from 'react-router'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {getConfigProperty} from '../../common/util/config'
import {fetchProjectFeeds} from './feeds'
import {handleJobResponse} from './status'
import {getActiveProject} from '../selectors'
import {setVisibilitySearchText} from './visibilityFilter'

import type {Project} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

// Bulk Project Actions
const receiveProjects = createAction(
  'RECEIVE_PROJECTS',
  (payload: Array<Project>) => payload
)
const requestingProjects = createVoidPayloadAction('REQUESTING_PROJECTS')
// Single Project Actions
const requestingProject = createVoidPayloadAction('REQUESTING_PROJECT')
const savingProject = createVoidPayloadAction('SAVING_PROJECT')
// Also used in deployments.js (actions)
export const receiveProject = createAction(
  'RECEIVE_PROJECT',
  (payload: ?Project) => payload
)
const settingActiveProject = createAction(
  'SET_ACTIVE_PROJECT',
  (payload: Project) => payload
)
const runningFetchFeedsForProject = createVoidPayloadAction('RUNNING_FETCH_FEED_FOR_PROJECT')
// Used by component
export const createProject = createAction(
  'CREATE_PROJECT',
  (payload: Project) => payload
)

export type ProjectActions = ActionType<typeof receiveProjects> |
  ActionType<typeof requestingProjects> |
  ActionType<typeof requestingProject> |
  ActionType<typeof savingProject> |
  ActionType<typeof receiveProject> |
  ActionType<typeof settingActiveProject> |
  ActionType<typeof runningFetchFeedsForProject> |
  ActionType<typeof createProject>

export function setActiveProject (project: Project) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    return dispatch(fetchProjectFeeds(project.id))
      .then(() => dispatch(settingActiveProject(project)))
  }
}

export function fetchProjects (getActive: ?boolean = false) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingProjects())
    return dispatch(secureFetch('/api/manager/secure/project'))
      .then(response => response.json())
      .then(projects => {
        dispatch(receiveProjects(projects))
        // return active project if requested
        if (getActive) {
          const activeProject = getActiveProject(getState())
          if (activeProject && !activeProject.feedSources) {
            return dispatch(fetchProjectFeeds(activeProject.id))
              .then(() => activeProject)
          }
        }
        return projects
      })
  }
}

export function fetchProjectsWithPublicFeeds () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingProjects())
    const url = '/api/manager/public/project'
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(projects => dispatch(receiveProjects(projects)))
  }
}

export function fetchProject (projectId: string, unsecure: ?boolean) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingProject())
    const apiRoot = unsecure ? 'public' : 'secure'
    const url = `/api/manager/${apiRoot}/project/${projectId}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(project => {
        dispatch(receiveProject(project))
        return project
      })
  }
}

export function fetchProjectWithFeeds (projectId: string, unsecure: ?boolean) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingProject())
    const apiRoot = unsecure ? 'public' : 'secure'
    const url = `/api/manager/${apiRoot}/project/${projectId}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(project => {
        dispatch(receiveProject(project))
        if (!unsecure) {
          return dispatch(fetchProjectFeeds(project.id))
        }
      })
      .catch(err => {
        console.warn(err)
        dispatch(receiveProject(null))
      })
  }
}

export function deleteProject (project: Project) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/manager/secure/project/${project.id}`
    return dispatch(secureFetch(url, 'delete'))
      .then(response => response.json())
      .then(() => browserHistory.push(`/home`))
  }
}

export function updateProject (
  project: Project,
  changes: {[string]: any},
  fetchFeeds: ?boolean = false
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(savingProject())
    const url = `/api/manager/secure/project/${project.id}`
    return dispatch(secureFetch(url, 'put', changes))
      .then((res) => {
        if (fetchFeeds) {
          return dispatch(fetchProjectWithFeeds(project.id))
        } else {
          return dispatch(fetchProject(project.id))
        }
      })
  }
}

export function deployPublic (project: Project) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/manager/secure/project/${project.id}/deployPublic`
    return dispatch(secureFetch(url, 'post'))
      .then((res) => res.json())
      .then(json => {
        return json
      })
  }
}

export function thirdPartySync (projectId: string, type: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/manager/secure/project/${projectId}/thirdPartySync/${type}`
    return dispatch(secureFetch(url))
      .then(res => dispatch(handleJobResponse(res, `Error syncing with ${type}`)))
  }
}

export function fetchFeedsForProject (project: Project) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(runningFetchFeedsForProject())
    const url = `/api/manager/secure/project/${project.id}/fetch`
    return dispatch(secureFetch(url, 'post'))
      .then(res => dispatch(handleJobResponse(res, 'Error fetching project feeds')))
  }
}

export function saveProject (props: {[string]: any}) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(savingProject())
    const url = '/api/manager/secure/project'
    return dispatch(secureFetch(url, 'post', props))
      .then((res) => res.json())
      .then((json) => dispatch(fetchProjects()))
  }
}

/**
 * Download a merged GTFS file for a Project
 */
export function downloadFeedForProject (project: Project) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/manager/secure/project/${project.id}/download`
    return dispatch(secureFetch(url))
      .then(res => dispatch(handleJobResponse(res, 'Error merging project feeds')))
  }
}

/**
 * Download a GTFS file for a merged project feed.
 */
export function downloadMergedFeedViaToken (
  projectId: string,
  isPublic: boolean
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const route = isPublic ? 'public' : 'secure'
    const url = `/api/manager/${route}/project/${projectId}/downloadtoken`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(json => {
        if (getConfigProperty('application.data.use_s3_storage')) {
          // Download object using presigned S3 URL.
          window.location.assign(json.url)
        } else {
          // use token to download feed
          window.location.assign(`/api/manager/downloadprojectfeed/${json.id}`)
        }
      })
  }
}

/**
 * When project viewer component mounts, unconditionally load project with feed
 * sources to ensure that updates to feed sources (e.g., a new feed version) are
 * applied to other project collections (e.g., a deployment that references said
 * feed source).
 * TODO: move to component
 */
export function onProjectViewerMount (initialProps: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {projectId} = initialProps.router.params
    dispatch(setVisibilitySearchText(null))
    dispatch(fetchProjectWithFeeds(projectId))
  }
}
