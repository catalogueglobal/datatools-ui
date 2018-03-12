import { connect } from 'react-redux'
import { browserHistory } from 'react-router'
import ProjectViewer from '../components/ProjectViewer'

import { setVisibilitySearchText, setVisibilityFilter } from '../actions/visibilityFilter'
import {
  fetchProject,
  deleteProject,
  thirdPartySync,
  fetchFeedsForProject,
  updateProject,
  downloadFeedForProject,
  deployPublic
   } from '../actions/projects'
import {
  fetchProjectFeeds,
  createFeedSource,
  saveFeedSource,
  updateFeedSource,
  runFetchFeed,
  deleteFeedSource
} from '../actions/feeds'

import {
  fetchProjectDeployments,
  createDeployment,
  createDeploymentFromFeedSource,
  saveDeployment,
  deleteDeployment,
  updateDeployment
} from '../actions/deployments'
import {
  uploadFeed
} from '../actions/versions'
const mapStateToProps = (state, ownProps) => {
  return {
    project: state.projects.all
      ? state.projects.all.find(p => p.id === ownProps.routeParams.projectId)
      : null,
    visibilityFilter: state.projects.filter,
    activeComponent: ownProps.routeParams.subpage,
    activeSubComponent: ownProps.routeParams.subsubpage,
    user: state.user,
    isFetching: state.projects.isFetching
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const projectId = ownProps.routeParams.projectId
  return {
    onComponentMount: (initialProps) => {
      if (initialProps.user.profile === null) {
        return
      }
      dispatch(setVisibilitySearchText(null))
      if (!initialProps.project) {
        dispatch(fetchProject(projectId))
        .then(project => {
          dispatch(fetchProjectFeeds(projectId))
        })
      } else if (!initialProps.project.feedSources || initialProps.project.feedSources.length !== initialProps.project.numberOfFeeds) {
        dispatch(fetchProjectFeeds(projectId))
      }
    },
    createDeploymentFromFeedSource: (feedSource) => dispatch(createDeploymentFromFeedSource(feedSource)),
    deleteFeedSource: (feedSource) => dispatch(deleteFeedSource(feedSource)),
    deleteProject: (project) => {
      return dispatch(deleteProject(project))
        .then(() => browserHistory.push('/home'))
    },
    deleteDeploymentConfirmed: (deployment) => dispatch(deleteDeployment(deployment)),
    deploymentsRequested: () => dispatch(fetchProjectDeployments(projectId)),
    deployPublic: (project) => dispatch(deployPublic(project)),
    downloadMergedFeed: (project) => dispatch(downloadFeedForProject(project)),
    fetchFeed: (feedSource) => dispatch(runFetchFeed(feedSource)),
    newDeploymentNamed: (name) => dispatch(saveDeployment({ projectId, name })),
    onNewDeploymentClick: () => dispatch(createDeployment(projectId)),
    onNewFeedSourceClick: () => dispatch(createFeedSource(projectId)),
    saveFeedSource: (name) => dispatch(saveFeedSource({ projectId, name })),
    searchTextChanged: (text) => dispatch(setVisibilitySearchText(text)),
    thirdPartySync: (type) => dispatch(thirdPartySync(projectId, type)),
    updateFeedSourceProperty: (feedSource, propName, newValue) => dispatch(updateFeedSource(feedSource, { [propName]: newValue })),
    updateAllFeeds: (project) => dispatch(fetchFeedsForProject(project)),
    updateDeployment: (deployment, changes) => dispatch(updateDeployment(deployment, changes)),
    updateProjectSettings: (project, newSettings) => dispatch(updateProject(project, newSettings, true)),
    uploadFeed: (feedSource, file) => dispatch(uploadFeed(feedSource, file)),
    visibilityFilterChanged: (filter) => dispatch(setVisibilityFilter(filter))
  }
}

const ActiveProjectViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectViewer)

export default ActiveProjectViewer
