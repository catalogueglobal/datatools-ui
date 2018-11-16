// @flow

import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {fetchDeployment} from './deployments'
import {fetchFeedSource} from './feeds'
import {downloadMergedFeedViaToken, fetchProjectWithFeeds} from './projects'
import {downloadSnapshotViaCredentials} from '../../editor/actions/snapshots'

import type {ServerJob} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

type ErrorMessage = {
  action?: string,
  detail?: any,
  message: string,
  title?: string
}

export const clearStatusModal = createVoidPayloadAction('CLEAR_STATUS_MODAL')
const handlingFinishedJob = createAction(
  'HANDLING_FINISHED_JOB',
  (payload: ServerJob) => payload
)
export const receiveJobs = createAction(
  'RECEIVE_JOBS',
  (payload: Array<ServerJob>) => payload
)
export const removeRetiredJob = createAction(
  'REMOVE_RETIRED_JOB',
  (payload: ServerJob) => payload
)
export const setErrorMessage = createAction(
  'SET_ERROR_MESSAGE',
  (payload: ErrorMessage | Promise<ErrorMessage>) => payload
)
export const setJobMonitorTimer = createAction(
  'SET_JOBMONITOR_TIMER',
  (payload: ?IntervalID) => payload
)
export const setJobMonitorVisible = createAction(
  'SET_JOBMONITOR_VISIBLE',
  (payload: boolean) => payload
)
const setAppInfo = createAction(
  'SET_APP_INFO',
  (payload: {
    commit: string,
    repoUrl: string
  }) => payload
)

export type StatusActions = ActionType<typeof clearStatusModal> |
  ActionType<typeof handlingFinishedJob> |
  ActionType<typeof receiveJobs> |
  ActionType<typeof removeRetiredJob> |
  ActionType<typeof setJobMonitorTimer> |
  ActionType<typeof setJobMonitorVisible> |
  ActionType<typeof setErrorMessage> |
  ActionType<typeof setAppInfo>

/**
 * Check status of user's jobs. Handle any finished jobs and if there are no
 * remaining active jobs, stop job monitor.
 */
export function checkJobStatus () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
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
      // Stop monitor if an error is encountered to avoid repeated requests.
      .catch(err => dispatch(stopJobMonitor()))
  }
}

export function fetchAppInfo () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    // only fetch if we don't yet have server info
    if (!getState().status.appInfo) {
      // fetch info.  If an error occurs or response json doesn't match, set
      // server info to value indicating an unknown commit and repoUrl
      return dispatch(secureFetch('/api/manager/public/appinfo'))
        .then(response => response.json())
        .then(info => {
          if (info.commit && info.repoUrl) {
            info.repoUrl = info.repoUrl.replace('.git', '')
            dispatch(setAppInfo(info))
          } else {
            throw new Error('unable to interpret app info')
          }
        })
        .catch(() => {
          dispatch(setAppInfo({
            commit: 'unknown',
            repoUrl: '?'
          }))
        })
    }
  }
}

/* eslint-disable complexity */
export function handleFinishedJob (job: ServerJob) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(handlingFinishedJob(job))
    switch (job.type) {
      case 'VALIDATE_FEED':
        if (!job.feedSourceId) {
          // FIXME use setErrorMessage instead?
          console.warn('No feedSourceId found on job')
          return
        }
        dispatch(fetchFeedSource(job.feedSourceId, true))
        break
      // CREATE_SNAPSHOT accounts for both creating an initial snapshot from GTFS
      // as well as "restoring" a snapshot to the active buffer, which essentially
      // just creates a copy of the snapshot to restore and points at the new
      // snapshot for the new buffer.
      case 'CREATE_SNAPSHOT':
        if (!job.feedSourceId) {
          // FIXME use setErrorMessage instead?
          console.warn('No feedSourceId found on job')
          return
        }
        dispatch(fetchFeedSource(job.feedSourceId, true))
        break
      // case 'PROCESS_SNAPSHOT':
      //   dispatch(fetchSnapshots(job.feedVersion.feedSource))
      //   break
      //
      case 'CREATE_FEEDVERSION_FROM_SNAPSHOT':
        if (!job.feedSourceId) {
          // FIXME use setErrorMessage instead?
          console.warn('No feedSourceId found on job')
          return
        }
        dispatch(fetchFeedSource(job.feedSourceId, true))
        break
      case 'EXPORT_SNAPSHOT_TO_GTFS':
        if (job.parentJobId) {
          console.log('Not downloading snapshot GTFS. Export job part of feed version creation.')
        } else {
          if (job.snapshot) {
            dispatch(downloadSnapshotViaCredentials(job.snapshot, false))
          }
        }
        break
      case 'MERGE_PROJECT_FEEDS':
        if (!job.projectId) {
          // FIXME use setErrorMessage instead?
          console.warn('No project ID found for job', job)
          return
        }
        dispatch(downloadMergedFeedViaToken(job.projectId, false))
        break
      case 'DEPLOY_TO_OTP':
        return dispatch(fetchDeployment(job.deploymentId))
      // No completion step for build transport network. User should just
      // re-request isochrones.
      case 'SYNC_PROJECT_FEEDS':
        if (!job.projectId) {
          // FIXME use setErrorMessage instead?
          console.warn('No project ID found for job', job)
          return
        }
        return dispatch(fetchProjectWithFeeds(job.projectId))
      default:
        console.warn(`No completion step defined for job type ${job.type}`)
    }
  }
}

export function handleJobResponse (response: Response, message: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    if (response.status >= 400) {
      const props = message
        ? {message}
        // If no message specified, use error message supplied by JSON response
        : response.json()
      return dispatch(setErrorMessage(props))
    } else {
      // Resulting JSON contains message and job ID wich which to monitor job.
      const json: {jobId: number, message: string} = (response.json(): any)
      dispatch(startJobMonitor())
      // Return json with job ID in case it is needed upstream
      return json
    }
  }
}

/**
 * Start job monitor. This stops any existing timer function and initializes
 * the fetch user jobs status function on a timer.
 */
export function startJobMonitor (showMonitor: boolean = true) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    stopCurrentTimer(getState())

    const timerFunction = () => dispatch(checkJobStatus())
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
 * Stop job time function stored with timer ID stored in state.
 */
function stopCurrentTimer (state) {
  const {timer} = state.status.jobMonitor
  if (timer) clearInterval(timer)
}

/**
 * Stop current job timer function and set job monitor (timer ID) to null.
 */
export function stopJobMonitor () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    stopCurrentTimer(getState())
    dispatch(setJobMonitorTimer(null))
  }
}
