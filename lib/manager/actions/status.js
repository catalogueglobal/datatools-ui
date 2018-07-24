import {createAction} from 'redux-actions'

import {secureFetch} from '../../common/actions'
import {fetchDeployment} from './deployments'
import {fetchFeedSource} from './feeds'
import {downloadMergedFeedViaToken} from './projects'
import {downloadSnapshotViaCredentials} from '../../editor/actions/snapshots'

export const setErrorMessage = createAction('SET_ERROR_MESSAGE')
export const clearStatusModal = createAction('CLEAR_STATUS_MODAL')
export const removeRetiredJob = createAction('REMOVE_RETIRED_JOB')
export const receiveJobs = createAction('RECEIVE_JOBS')
export const setJobMonitorTimer = createAction('SET_JOBMONITOR_TIMER')
const handlingFinishedJob = createAction('HANDLING_FINISHED_JOB')
const setJobMonitorVisible = createAction('SET_JOBMONITOR_VISIBLE')

/**
 * Check status of user's jobs. Handle any finished jobs and if there are no
 * remaining active jobs, stop job monitor.
 */
export function checkJobStatus () {
  return function (dispatch, getState) {
    return dispatch(secureFetch(`/api/manager/secure/status/jobs`))
      .then(response => response.json())
      .then(jobs => {
        // Check for any just-finished jobs
        const completedJobs = jobs
          .filter(job => job.status.completed || job.status.error)
        completedJobs
          // Retire any completed or errored jobs.
          .forEach(job => dispatch(handleFinishedJob(job)))

        const remainingJobs = jobs
          .filter(job => !job.status.completed && !job.status.error)
        if (remainingJobs.length === 0) {
          // If there are no remaining jobs, stop the timer.
          dispatch(stopJobMonitor())
        }
        // Add remaining jobs to set of active jobs. Note, this may be an empty
        // array if finished jobs have been handled, but that is the expected
        // behavior because these finished jobs will appear in a "retired" state.
        dispatch(receiveJobs(remainingJobs))
      })
  }
}

/**
 * Stop job time function stored with timer ID stored in state.
 */
function stopCurrentTimer (state) {
  const {timer} = state.status.jobMonitor
  if (timer) clearInterval(timer)
}

export function handleJobResponse (response, message) {
  return function (dispatch, getState) {
    if (response.status >= 400) {
      const props = message
        ? {message}
        // If no message specified, use error message supplied by JSON response
        : response.json()
      return dispatch(setErrorMessage(props))
    } else {
      // Resulting JSON contains message and job ID wich which to monitor job.
      const json = response.json()
      dispatch(startJobMonitor(json))
      // Return json with job ID in case it is needed upstream
      return json
    }
  }
}

/**
 * Start job monitor. This stops any existing timer function and initializes
 * the fetch user jobs status function on a timer.
 */
export function startJobMonitor (showMonitor = true) {
  return function (dispatch, getState) {
    stopCurrentTimer(getState())

    const timerFunction = () => {
      dispatch(checkJobStatus())
    }
    // make an initial call right now
    timerFunction()
    const timer = setInterval(timerFunction, 2000)
    if (showMonitor) {
      dispatch(setJobMonitorVisible(true))
    }
    dispatch(setJobMonitorTimer(timer))
  }
}

/**
 * Stop current job timer function and set job monitor (timer ID) to null.
 */
export function stopJobMonitor () {
  return function (dispatch, getState) {
    stopCurrentTimer(getState())
    dispatch(setJobMonitorTimer(null))
  }
}

export function handleFinishedJob (job) {
  return function (dispatch, getState) {
    dispatch(handlingFinishedJob(job))
    switch (job.type) {
      case 'VALIDATE_FEED':
        dispatch(fetchFeedSource(job.feedSourceId, true, true))
        break
      // CREATE_SNAPSHOT accounts for both creating an initial snapshot from GTFS
      // as well as "restoring" a snapshot to the active buffer, which essentially
      // just creates a copy of the snapshot to restore and points at the new
      // snapshot for the new buffer.
      case 'CREATE_SNAPSHOT':
        dispatch(fetchFeedSource(job.feedSourceId, true, true))
        break
      // case 'PROCESS_SNAPSHOT':
      //   dispatch(fetchSnapshots(job.feedVersion.feedSource))
      //   break
      //
      case 'CREATE_FEEDVERSION_FROM_SNAPSHOT':
        dispatch(fetchFeedSource(job.feedSourceId, true, true))
        break
      case 'EXPORT_SNAPSHOT_TO_GTFS':
        if (job.parentJobId) {
          console.log('Not downloading snapshot GTFS. Export job part of feed version creation.')
        } else {
          dispatch(downloadSnapshotViaCredentials(job.snapshot, false, 'snapshot'))
        }
        break
      case 'MERGE_PROJECT_FEEDS':
        return dispatch(downloadMergedFeedViaToken(job.project, false, 'project'))
      case 'DEPLOY_TO_OTP':
        return dispatch(fetchDeployment(job.deploymentId, false, 'project'))
      // No completion step for build transport network. User should just
      // re-request isochrones.
      case 'BUILD_TRANSPORT_NETWORK':
      default:
        console.warn(`No completion step defined for job type ${job.type}`)
    }
  }
}
