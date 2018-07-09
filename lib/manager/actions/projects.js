import { secureFetch } from '../../common/actions'
import { getConfigProperty } from '../../common/util/config'
import { fetchProjectFeeds } from './feeds'
import { updateGtfsFilter } from '../../gtfs/actions/filter'
import { downloadS3Key } from '../../manager/actions/versions'
import { setErrorMessage, startJobMonitor } from './status'
import {getActiveProject} from '../selectors'
// Bulk Project Actions

function requestingProjects () {
  return {
    type: 'REQUESTING_PROJECTS'
  }
}

function receiveProjects (projects) {
  return {
    type: 'RECEIVE_PROJECTS',
    projects
  }
}

function settingActiveProject (project) {
  return {
    type: 'SET_ACTIVE_PROJECT',
    project
  }
}
export function setActiveProject (project) {
  return function (dispatch, getState) {
    return dispatch(fetchProjectFeeds(project.id))
    .then(() => {
      dispatch(settingActiveProject(project))
      return dispatch(updateGtfsFilter(getActiveProject(getState()), getState().user))
    })
  }
}

export function fetchProjects (getActive = false) {
  return function (dispatch, getState) {
    dispatch(requestingProjects())
    return dispatch(secureFetch('/api/manager/secure/project'))
      .then(response => response.json())
      .then(projects => {
        dispatch(receiveProjects(projects))
        // return active project if requested
        if (getActive) {
          const activeProject = getActiveProject(getState())
          if (!activeProject.feedSources) {
            return dispatch(fetchProjectFeeds(activeProject.id))
            .then(() => {
              return dispatch(updateGtfsFilter(getActiveProject(getState()), getState().user))
              .then(() => {
                return activeProject
              })
            })
          }
        }
        return projects
      })
  }
}

export function fetchProjectsWithPublicFeeds () {
  return function (dispatch, getState) {
    dispatch(requestingProjects())
    const url = '/api/manager/public/project'
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(projects => {
        dispatch(receiveProjects(projects))
      })
      .catch((err) => {
        dispatch(
          setErrorMessage(
            `An error occurred while trying to fetch projects with public feeds: ${err}`
          )
        )
      })
  }
}

// Single Project Actions

function requestingProject () {
  return {
    type: 'REQUESTING_PROJECT'
  }
}

export function receiveProject (project) {
  return {
    type: 'RECEIVE_PROJECT',
    project
  }
}

export function fetchProject (projectId, unsecure) {
  return function (dispatch, getState) {
    dispatch(requestingProject())
    const apiRoot = unsecure ? 'public' : 'secure'
    const url = `/api/manager/${apiRoot}/project/${projectId}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      // .catch(err => console.log(err))
      .then(project => {
        dispatch(receiveProject(project))
        return project
        // if (!unsecure)
        //   return dispatch(fetchProjectFeeds(project.id))
      })
  }
}

export function fetchProjectWithFeeds (projectId, unsecure) {
  return function (dispatch, getState) {
    dispatch(requestingProject())
    const apiRoot = unsecure ? 'public' : 'secure'
    const url = `/api/manager/${apiRoot}/project/${projectId}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      // .catch(err => console.log(err))
      .then(project => {
        dispatch(receiveProject(project))
        if (!unsecure) {
          return dispatch(fetchProjectFeeds(project.id))
        }
      })
  }
}

function deletingProject () {
  return {
    type: 'DELETING_PROJECT'
  }
}

export function deletedProject (project) {
  return {
    type: 'DELETED_PROJECT',
    project
  }
}

export function deleteProject (project) {
  return function (dispatch, getState) {
    dispatch(deletingProject())
    const url = `/api/manager/secure/project/${project.id}`
    return dispatch(secureFetch(url, 'delete'))
      .then(response => response.json())
      // .catch(err => console.log(err))
      .then(project => {
        dispatch(deletedProject(project))
        return project
      })
  }
}

export function updateProject (project, changes, fetchFeeds = false) {
  return function (dispatch, getState) {
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

export function deployPublic (project) {
  return function (dispatch, getState) {
    // dispatch(savingProject())
    const url = `/api/manager/secure/project/${project.id}/deployPublic`
    return dispatch(secureFetch(url, 'post'))
      .then((res) => res.json())
      .then(json => {
        return json
      })
  }
}

export function createProject (project) {
  return {
    type: 'CREATE_PROJECT',
    project
  }
}

export function requestingSync () {
  return {
    type: 'REQUESTING_SYNC'
  }
}

export function receiveSync () {
  return {
    type: 'RECEIVE_SYNC'
  }
}

export function thirdPartySync (projectId, type) {
  return function (dispatch, getState) {
    dispatch(requestingSync())
    const url = '/api/manager/secure/project/' + projectId + '/thirdPartySync/' + type
    return dispatch(secureFetch(url))
      .then(response => response.json())
      // .catch(err => console.log(err))
      .then(project => {
        dispatch(receiveSync())
        return dispatch(fetchProjectWithFeeds(projectId))
      })
  }
}

export function runningFetchFeedsForProject () {
  return {
    type: 'RUNNING_FETCH_FEED_FOR_PROJECT'
  }
}

export function receiveFetchFeedsForProject (project) {
  return {
    type: 'RECEIVE_FETCH_FEED_FOR_PROJECT',
    project
  }
}

export function fetchFeedsForProject (project) {
  return function (dispatch, getState) {
    dispatch(runningFetchFeedsForProject())
    const url = `/api/manager/secure/project/${project.id}/fetch`
    return dispatch(secureFetch(url, 'post'))
      .then(res => {
        if (res.status === 304) {
          // dispatch(feedNotModified(feedSource, 'Feed fetch cancelled because it matches latest feed version.'))
          console.log('fetch cancelled because matches latest')
        } else if (res.status >= 400) {
          dispatch(setErrorMessage('Error fetching project feeds'))
        } else {
          dispatch(receiveFetchFeedsForProject(project))
          dispatch(startJobMonitor())
          return res.json()
        }
      })
      .then(result => {
        console.log('fetchFeed result', result)
        dispatch(receiveFetchFeedsForProject())
        dispatch((fetchProjectWithFeeds(project.id)))
      })
  }
}

function savingProject (props) {
  return {
    type: 'SAVING_PROJECT',
    props
  }
}

export function saveProject (props) {
  return function (dispatch, getState) {
    dispatch(savingProject(props))
    const url = '/api/manager/secure/project'
    return dispatch(secureFetch(url, 'post', props))
      .then((res) => res.json())
      .then((json) => dispatch(fetchProjects()))
  }
}

// Download a merged GTFS file for a Project

export function downloadFeedForProject (project) {
  return function (dispatch, getState) {
    const url = `/api/manager/secure/project/${project.id}/download`
    // window.location.assign(url)
    return dispatch(secureFetch(url))
    .then(res => {
      if (res.status >= 400) {
        dispatch(setErrorMessage('Error merging project feeds'))
      } else {
        dispatch(startJobMonitor())
      }
      return res.json()
    })
    .then(result => {
      // window.location.assign(`/api/manager/downloadfeed/${result.id}`)
      console.log(result)
      // var zipName = 'download.zip';
      // var a = document.createElement('a');
      // a.href = "data:application/zip;base64," + result;
      // a.download = zipName;
      // a.click();
    })
  }
}

// Download a GTFS file for a FeedVersion
export function downloadMergedFeedViaToken (project, isPublic, prefix) {
  return function (dispatch, getState) {
    const route = isPublic ? 'public' : 'secure'
    const url = `/api/manager/${route}/project/${project.id}/downloadtoken`
    dispatch(secureFetch(url))
    .then(response => response.json())
    .then(credentials => {
      if (getConfigProperty('application.data.use_s3_storage')) {
        dispatch(downloadS3Key(credentials, `${project.id}.zip`, 'project'))
      } else {
        // use token to download feed
        window.location.assign(`/api/manager/downloadprojectfeed/${credentials.id}`)
      }
    })
  }
}
