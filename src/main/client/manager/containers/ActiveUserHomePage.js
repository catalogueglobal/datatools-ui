import { connect } from 'react-redux'
import UserHomePage from '../components/UserHomePage'
import { getRecentActivity } from '../actions/user'
import { fetchProjects } from '../actions/projects'
import { fetchProjectFeeds } from '../actions/feeds'

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    projects: state.projects.all ? state.projects.all.filter(p => p.isCreating || state.user.permissions.isApplicationAdmin() || state.user.permissions.hasProject(p.id)) : [],
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onComponentMount: (props) => {
      dispatch(getRecentActivity(props.user))
      dispatch(fetchProjects())
      .then(projects => {
        for (var i = 0; i < projects.length; i++) {
          dispatch(fetchProjectFeeds(projects[i].id))
        }
      })
    }
  }
}

const ActiveUserHomePage = connect(
  mapStateToProps,
  mapDispatchToProps
)(UserHomePage)

export default ActiveUserHomePage