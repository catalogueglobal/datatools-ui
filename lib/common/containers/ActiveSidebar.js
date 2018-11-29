// @flow

import {connect} from 'react-redux'

import Sidebar from '../components/Sidebar'
import {logout, revokeToken} from '../../manager/actions/user'
import {
  fetchAppInfo,
  removeRetiredJob,
  startJobMonitor,
  setJobMonitorVisible
} from '../../manager/actions/status'
import {setSidebarExpanded, setTutorialHidden} from '../../manager/actions/ui'
import type {AppState} from '../../types/reducers'

const mapStateToProps = (state: AppState, ownProps) => {
  return {
    expanded: state.ui.sidebarExpanded,
    hideTutorial: state.ui.hideTutorial,
    jobMonitor: state.status.jobMonitor,
    languages: state.languages ? state.languages : ['English', 'Español', 'Français'],
    projects: state.projects ? state.projects : null,
    appInfo: state.status.appInfo,
    user: state.user,
    userPicture: state.user.profile ? state.user.profile.picture : null
  }
}

const mapDispatchToProps = {
  fetchAppInfo,
  logout,
  removeRetiredJob,
  revokeToken,
  setJobMonitorVisible,
  setSidebarExpanded,
  setTutorialHidden,
  startJobMonitor
}

const ActiveSidebar = connect(mapStateToProps, mapDispatchToProps)(Sidebar)

export default ActiveSidebar
