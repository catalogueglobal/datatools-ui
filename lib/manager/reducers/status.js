// @flow

import update from 'react-addons-update'

export type StatusState = {
  message: any,
  modal: any,
  jobMonitor: {
    timer: any,
    visible: boolean,
    jobs: Array<any>,
    retired: Array<any>
  }
}

export const defaultState = {
  message: null,
  modal: null,
  jobMonitor: {
    timer: null,
    visible: false,
    jobs: [],
    retired: []
  }
}

const config = (state: StatusState = defaultState, action: any): StatusState => {
  switch (action.type) {
    // Status Messages
    case 'REQUESTING_PROJECTS':
      return update(state, {message: {$set: 'Loading projects...'}})
    case 'REQUESTING_PROJECT':
      return update(state, {message: {$set: 'Loading project...'}})
    case 'SAVING_PROJECT':
      return update(state, {message: {$set: 'Saving project...'}})
    case 'REQUESTING_FEEDSOURCES':
      return update(state, {message: {$set: 'Loading feeds...'}})
    case 'REQUESTING_FEEDSOURCE':
      return update(state, {message: {$set: 'Loading feed...'}})
    case 'SAVING_FEEDSOURCE':
      return update(state, {message: {$set: 'Saving feed...'}})
    case 'DELETING_FEEDSOURCE':
      return update(state, {message: {$set: 'Deleting feed...'}})
    case 'RUNNING_FETCH_FEED':
      return update(state, {message: {$set: 'Updating feed...'}})
    case 'REQUESTING_FEEDVERSIONS':
      return update(state, {message: {$set: 'Loading feed versions...'}})
    case 'DELETING_FEEDVERSION':
      return update(state, {message: {$set: 'Deleting feed version...'}})
    case 'UPLOADING_FEED':
      return update(state, {message: {$set: 'Uploading feed...'}})
    case 'REQUESTING_SYNC':
      return update(state, {message: {$set: 'Syncing feeds...'}})
    case 'RUNNING_FETCH_FEED_FOR_PROJECT':
      return update(state, {message: {$set: 'Updating feeds for project...'}})
    case 'REQUESTING_PUBLIC_FEEDS':
      return update(state, {message: {$set: 'Loading public feeds...'}})
    case 'REQUESTING_VALIDATION_ISSUE_COUNT':
      return update(state, {message: {$set: 'Loading validation result...'}})
    case 'REQUESTING_NOTES':
      return update(state, {message: {$set: 'Loading comments...'}})
    case 'REQUESTING_GTFSPLUS_CONTENT':
      return update(state, {message: {$set: 'Loading GTFS+ data...'}})
    case 'UPLOADING_GTFSPLUS_FEED':
      return update(state, {message: {$set: 'Saving GTFS+ data...'}})
    case 'PUBLISHING_GTFSPLUS_FEED':
      return update(state, {message: {$set: 'Publishing GTFS+ feed...'}})
    case 'VALIDATING_GTFSPLUS_FEED':
      return update(state, {message: {$set: 'Updating GTFS+ validation...'}})
    case 'REQUESTING_FEEDVERSION_ISOCHRONES':
      return update(state, {message: {$set: 'Calculating access shed...'}})
    case 'REQUESTING_DEPLOYMENTS':
      return update(state, {message: {$set: 'Loading deployments...'}})
    case 'REQUESTING_DEPLOYMENT':
      return update(state, {message: {$set: 'Loading deployment...'}})
    case 'SAVING_DEPLOYMENT':
      return update(state, {message: {$set: 'Saving deployment...'}})
    case 'REQUESTING_GTFSEDITOR_SNAPSHOTS':
      return update(state, {message: {$set: 'Loading snapshots...'}})
    case 'SAVING_AGENCY':
      return update(state, {message: {$set: 'Saving agency...'}})
    case 'SAVING_STOP':
      return update(state, {message: {$set: 'Saving stop...'}})
    case 'SAVING_ROUTE':
      return update(state, {message: {$set: 'Saving route...'}})
    case 'REQUESTING_AGENCIES':
      return update(state, {message: {$set: 'Loading agencies...'}})
    case 'REQUESTING_STOPS':
      return update(state, {message: {$set: 'Loading stops...'}})
    case 'REQUESTING_ROUTES':
      return update(state, {message: {$set: 'Loading routes...'}})
    case 'REQUESTING_TRIPS_FOR_CALENDAR':
      return update(state, {message: {$set: 'Loading trips...'}})
    case 'CREATING_SNAPSHOT':
      return update(state, {message: {$set: 'Creating snapshot...'}})
    case 'DELETING_SNAPSHOT':
      return update(state, {message: {$set: 'Deleting snapshot...'}})
    case 'DELETING_AGENCY':
      return update(state, {message: {$set: 'Deleting agency...'}})
    case 'DELETING_TRIPS_FOR_CALENDAR':
      return update(state, {message: {$set: 'Deleting trips...'}})
    case 'RESTORING_SNAPSHOT':
      return update(state, {message: {$set: 'Restoring snapshot...'}})
    case 'RENAMING_FEEDVERSION':
      return update(state, {message: {$set: 'Renaming feed version...'}})
    case 'LOADING_FEEDVERSION_FOR_EDITING':
      return update(state, {message: {$set: 'Loading version into editor...'}})
    case 'REQUESTING_ORGANIZATIONS':
      return update(state, {message: {$set: 'Loading organizations...'}})

    // Alerts/signs status message
    case 'REQUEST_RTD_SIGNS':
      return update(state, {message: {$set: 'Loading signs...'}})
    case 'REQUEST_RTD_ALERTS':
      return update(state, {message: {$set: 'Loading alerts...'}})

    // STATUS MODAL UPDATES (TYPICALLY SET ON JOB COMPLETION)
    case 'SET_ERROR_MESSAGE':
      const {action: actionType, message: body, detail, title} = action.payload
      return update(state, {
        modal: {$set: {
          title: title || 'Warning!',
          body,
          action: actionType,
          detail
        }},
        message: {$set: null}
      })
    case 'CLEAR_STATUS_MODAL':
      return update(state, {modal: {$set: null}})
    case 'CREATED_SNAPSHOT':
      return update(state, {
        modal: {$set: {
          title: 'Snapshot Created',
          body: `New snapshot "${action.payload}" created. It will be accessible from the "Editor Snapshots" tab in the main Feed Source page.`
        }},
        message: {$set: null}
      })
    case 'RESTORED_SNAPSHOT':
      return update(state, {
        modal: {$set: {title: 'Snapshot Restored', body: `Snapshot "${action.name}" is now active in the GTFS Editor for this feed.`}},
        message: {$set: null}
      })

    // Job Monitor
    case 'SET_JOBMONITOR_TIMER':
      return update(state, {jobMonitor: {$merge: {timer: action.payload}}})
    case 'SET_JOBMONITOR_VISIBLE':
      return update(state, {jobMonitor: {$merge: {visible: action.payload}}})
    case 'HANDLING_FINISHED_JOB':
      return update(state, {jobMonitor: {retired: {$push: [action.payload]}}})
    case 'REMOVE_RETIRED_JOB':
      const {jobId} = action.payload
      const jobIndex = state.jobMonitor.retired
        .findIndex(job => job.jobId === jobId)
      if (jobIndex === -1) {
        // If somehow the job does not exist in the state, ignore the action.
        console.warn(`Job with ID ${jobId} does not exist in retired jobs list.`)
        return state
      }
      return update(state, {jobMonitor: {retired: {$splice: [[jobIndex, 1]]}}})
    case 'RECEIVE_JOBS':
      const updatedJobs = action.payload || []
      return update(state, {jobMonitor: {jobs: {$set: updatedJobs}}})

    // case 'DEPLOYING_TO_TARGET':
    //  return update(state, { popover: { jobs: { $push: [{name: `Processing deployment`, percent_complete: 5, status: 'processing'}] } } })

    // ***** The following actions simply blank out the status message ******
    case 'RECEIVE_PROJECTS':
    case 'RECEIVE_PROJECT':
    case 'RECEIVE_SYNC':
    case 'RECEIVE_FEEDSOURCES':
    case 'RECEIVE_FEEDSOURCE':
    case 'RECEIVE_FEEDVERSIONS':
    case 'RECEIVE_FEEDVERSION':
    case 'RECEIVED_FETCH_FEED':
    case 'RECEIVE_FETCH_FEED_FOR_PROJECT':
    case 'RECEIVE_PUBLIC_FEEDS':
    case 'RECEIVE_VALIDATION_ISSUE_COUNT':
    case 'RECEIVE_NOTES_FOR_FEEDVERSION':
    case 'RECEIVE_NOTES_FOR_FEEDSOURCE':
    case 'RECEIVE_GTFSPLUS_CONTENT':
    case 'UPLOADED_GTFSPLUS_FEED':
    case 'RECEIVE_GTFSPLUS_VALIDATION':
    case 'RECEIVE_FEEDVERSION_ISOCHRONES':
    case 'RECEIVE_DEPLOYMENTS':
    case 'RECEIVE_DEPLOYMENT':
    case 'RECEIVE_AGENCY':
    case 'RECEIVE_AGENCIES':
    case 'RECEIVE_STOP':
    case 'RECEIVE_STOPS':
    case 'RECEIVE_ROUTE':
    case 'RECEIVE_ROUTES':
    case 'DELETED_TRIPS_FOR_CALENDAR':
    case 'RECEIVE_TRIPS_FOR_CALENDAR':
    case 'RECEIVE_GTFSEDITOR_SNAPSHOTS':
    case 'RECEIVED_RTD_SIGNS':
    case 'RECEIVED_RTD_ALERTS':
    case 'RECEIVE_ORGANIZATIONS':
      return update(state, {message: {$set: null}})
    default:
      return state
  }
}

export default config
