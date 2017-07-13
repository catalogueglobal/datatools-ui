import React, { Component } from 'react'
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom'
import { connect } from 'react-redux'

import ActiveUserAdmin from '../../admin/containers/ActiveUserAdmin'
import MainAlertsViewer from '../../alerts/containers/MainAlertsViewer'
import ActiveAlertEditor from '../../alerts/containers/ActiveAlertEditor'
import PageNotFound from '../components/PageNotFound'
import Login from '../containers/Login'
import ActiveGtfsEditor from '../../editor/containers/ActiveGtfsEditor'
import { checkLogin } from '../../manager/actions/user'
import ActiveDeploymentViewer from '../../manager/containers/ActiveDeploymentViewer'
import ActiveFeedSourceViewer from '../../manager/containers/ActiveFeedSourceViewer'
import ActiveProjectsList from '../../manager/containers/ActiveProjectsList'
import ActiveProjectViewer from '../../manager/containers/ActiveProjectViewer'
import ActiveUserHomePage from '../../manager/containers/ActiveUserHomePage'
import ActivePublicFeedSourceViewer from '../../public/containers/ActivePublicFeedSourceViewer'
import ActivePublicFeedsViewer from '../../public/containers/ActivePublicFeedsViewer'
import ActiveSignupPage from '../../public/containers/ActiveSignupPage'
import ActiveUserAccount from '../../public/containers/ActiveUserAccount'
import ActiveGtfsPlusEditor from '../../gtfsplus/containers/ActiveGtfsPlusEditor'
import ActiveSignEditor from '../../signs/containers/ActiveSignEditor'
import MainSignsViewer from '../../signs/containers/MainSignsViewer'
import { isModuleEnabled } from '../util/config'

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user
  }
}

const mapDispatchToProps = {
  checkLogin
}

function loginOptional (ComponentToWrap) {
  class OptionalLogin extends Component {
    componentWillMount () {
      const {checkLogin, user} = this.props
      if (!user.token) {
        // user is not logged in, try to silently log them in
        checkLogin()
      }
    }

    render () {
      return <ComponentToWrap />
    }
  }

  return connect(mapStateToProps, mapDispatchToProps)(OptionalLogin)
}

function authRequired (ComponentToWrap) {
  class AuthRequired extends Component {
    componentWillMount () {
      const {checkLogin, user} = this.props
      if (!user.token) {
        // user is not logged in, try to silently log them in
        checkLogin()
      }
    }

    render () {
      const {user} = this.props
      if (!user.token) {
        if (user.isCheckingLogin) {
          return (
            <div>
              <p>Attempting to renew login...</p>
            </div>
          )
        } else {
          return <Login />
        }
      } else {
        return <ComponentToWrap />
      }
    }
  }

  return connect(mapStateToProps, mapDispatchToProps)(AuthRequired)
}

function adminRequired (ComponentToWrap) {
  class AuthRequired extends Component {
    componentWillMount () {
      const {checkLogin, user} = this.props
      if (!user.token) {
        // user is not logged in, try to silently log them in
        checkLogin()
      }
    }

    render () {
      const {user} = this.props
      if (!user.token) {
        if (user.isCheckingLogin) {
          return (
            <div>
              <p>Attempting to renew login...</p>
            </div>
          )
        } else {
          return <Login />
        }
      } else {
        if (true) {
          return <Redirect to='/' />
        } else {
          return <ComponentToWrap />
        }
      }
    }
  }

  return connect(mapStateToProps, mapDispatchToProps)(AuthRequired)
}

export default class App extends Component {
  render () {
    const {history} = this.props
    const routes = [{
      path: '/',
      component: loginOptional(ActivePublicFeedsViewer)
    }, {
      path: '/settings(/:subpage)(/:projectId)',
      component: authRequired(ActiveUserAccount)
    }, {
      path: '/admin(/:subpage)',
      component: adminRequired(ActiveUserAdmin)
    }, {
      path: '/signup',
      component: loginOptional(ActiveSignupPage)
    }, {
      path: '/home(/:projectId)',
      component: authRequired(ActiveUserHomePage)
    }, {
      path: '/public/feed/:feedSourceId(/version/:feedVersionIndex)',
      component: loginOptional(ActivePublicFeedSourceViewer)
    }, {
      path: '/project',
      component: authRequired(ActiveProjectsList)
    }, {
      path: '/project/:projectId(/:subpage)(/:subsubpage)',
      component: authRequired(ActiveProjectViewer)
    }, {
      path: '/feed/:feedSourceId/edit(/:activeComponent)(/:activeEntityId)(/:subComponent)(/:subEntityId)(/:subSubComponent)(/:activeSubSubEntity)',
      component: authRequired(ActiveGtfsEditor)
    }, {
      path: '/feed/:feedSourceId(/version/:feedVersionIndex)(/:subpage)(/:subsubpage)',
      component: authRequired(ActiveFeedSourceViewer)
    }, {
      path: '/deployment/:deploymentId',
      component: authRequired(ActiveDeploymentViewer)
    }, {
      path: '/gtfsplus/:feedSourceId/:feedVersionId',
      component: authRequired(ActiveGtfsPlusEditor)
    }, {
      component: loginOptional(PageNotFound)
    }]

    // register routes if alerts module enabled (unshift so they're before wildcard route)
    if (isModuleEnabled('alerts')) {
      routes.unshift(
        {path: 'alerts', component: MainAlertsViewer, onEnter: this.requireAuth},
        {path: 'alerts/new', component: ActiveAlertEditor, onEnter: this.requireAuth},
        {path: 'alerts/alert/:alertId', component: ActiveAlertEditor, onEnter: this.requireAuth},
      )
    }

    // register routes if sign_config module enabled (unshift so they're before wildcard route)
    if (isModuleEnabled('sign_config')) {
      routes.unshift(
        {path: 'signs', component: MainSignsViewer, onEnter: this.requireAuth},
        {path: 'signs/new', component: ActiveSignEditor, onEnter: this.requireAuth},
        {path: 'signs/sign/:signId', component: ActiveSignEditor, onEnter: this.requireAuth},
      )
    }

    return <Router history={history}>
      <Switch>
        {routes.map((r, i) => (<Route {...r} key={i} />))}
      </Switch>
    </Router>
  }
}
