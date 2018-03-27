import omit from 'lodash.omit'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {browserHistory, Router, Route} from 'react-router'

import ActiveUserAdmin from '../../admin/containers/ActiveUserAdmin'
import MainAlertsViewer from '../../alerts/containers/MainAlertsViewer'
import ActiveAlertEditor from '../../alerts/containers/ActiveAlertEditor'
import PageNotFound from '../components/PageNotFound'
import ActiveGtfsEditor from '../../editor/containers/ActiveGtfsEditor'
import Login from './Login'
import {checkLogin, login} from '../../manager/actions/user'
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
import {isModuleEnabled} from '../util/config'

function wrapComponentInAuthStrategy (
  ComponentToWrap,
  requireAuth,
  requireAdmin
) {
  class AuthStrategyWrapper extends Component {
    componentWillMount () {
      const {checkLogin, user} = this.props
      const userIsLoggedIn = !!user.token
      checkLogin(userIsLoggedIn)
      if (userIsLoggedIn) {
        this._checkIfAdmin()
      }
    }

    componentWillReceiveProps (nextProps) {
      const {user} = nextProps
      // First check to see if admin privileges are needed.
      this._checkIfAdmin()
      if (
        // Auth required and user is not logged in.
        (requireAuth && !user.isCheckingLogin && !user.token) // ||
        // Token existed previously, but was removed in next props.
        // FIXME: Is this second condition needed here?
        // (this.props.user.token && !user.token)
      ) {
        // If auth is required and the user is not logged in, trigger a log in,
        // which will change the route to '/login' and show the auth0 lock.
        const redirectUrl = window.location.pathname
        this.props.login(redirectUrl)
      }
    }

    _userHasAdminViewPrivileges () {
      const {user} = this.props
      return !!(user &&
        user.permissions &&
        (user.permissions.isApplicationAdmin() ||
          user.permissions.canAdministerAnOrganization()
        )
      )
    }

    _checkIfAdmin () {
      if (requireAdmin &&
        !this.props.user.isCheckingLogin &&
        !this._userHasAdminViewPrivileges()
      ) {
        // If an authenticated, non-admin user attempts to visit an admin page,
        // send them back to the root page.
        browserHistory.push('/')
      }
    }

    render () {
      const {user} = this.props
      if (requireAuth && !user.token) {
        // If user is not authenticated and the page requires it, return the
        // unauthorized user page. We should only get to this point if there is
        // a slight delay in the component lifecycle.
        // When the component receives props, a check for auth will trigger the
        // login with lock.
        return null
      } else {
        // Otherwise, check for admin access and finally just return the page.
        if (requireAdmin && !this._userHasAdminViewPrivileges()) {
          // If admin privileges are required, but the user is not authorized.
          return (
            <div>
              <p>You have attempted to view a restricted page without proper credentials</p>
            </div>
          )
        } else {
          // User is authenticated to view page or it is a public route.
          return (
            <ComponentToWrap
              // Pass props to wrapped component except for auth-specific props
              {...omit(this.props, ['checkLogin', 'children', 'user'])}
              />
          )
        }
      }
    }
  }

  return connect(
    // state to props
    state => ({user: state.user}),
    // dispatch to props
    {checkLogin, login})(
    AuthStrategyWrapper
  )
}

function loginOptional (ComponentToWrap) {
  return wrapComponentInAuthStrategy(ComponentToWrap)
}

function authRequired (ComponentToWrap) {
  return wrapComponentInAuthStrategy(ComponentToWrap, true)
}

function adminRequired (ComponentToWrap) {
  return wrapComponentInAuthStrategy(ComponentToWrap, true, true)
}

export default class App extends Component {
  render () {
    const {history} = this.props
    const routes = [
      {
        path: '/settings(/:subpage)(/:projectId)',
        component: authRequired(ActiveUserAccount)
      },
      {
        path: '/admin(/:subpage)',
        component: adminRequired(ActiveUserAdmin)
      },
      {path: '/signup', component: loginOptional(ActiveSignupPage)},
      {
        path: '/home(/:projectId)',
        component: authRequired(ActiveUserHomePage)
      },
      {path: '/login', component: Login},
      {path: '/', component: loginOptional(ActivePublicFeedsViewer)},
      {
        path: '/public/feed/:feedSourceId(/version/:feedVersionIndex)',
        component: loginOptional(ActivePublicFeedSourceViewer)
      },
      {
        path: '/project',
        component: authRequired(ActiveProjectsList)
      },
      {
        path: '/project/:projectId(/:subpage)(/:subsubpage)',
        component: authRequired(ActiveProjectViewer)
      },
      {
        path:
          '/feed/:feedSourceId/edit(/:activeComponent)(/:activeEntityId)(/:subComponent)(/:subEntityId)(/:subSubComponent)(/:activeSubSubEntity)',
        component: authRequired(ActiveGtfsEditor)
      },
      {
        path:
          '/feed/:feedSourceId(/version/:feedVersionIndex)(/:subpage)(/:subsubpage)',
        component: authRequired(ActiveFeedSourceViewer)
      },
      {
        path: '/deployment/:deploymentId',
        component: authRequired(ActiveDeploymentViewer)
      },
      {
        path: '/gtfsplus/:feedSourceId/:feedVersionId',
        component: authRequired(ActiveGtfsPlusEditor)
      },
      {path: '*', component: loginOptional(PageNotFound)}
    ]

    // register routes if alerts module enabled (unshift so they're before wildcard route)
    if (isModuleEnabled('alerts')) {
      routes.unshift(
        {
          path: 'alerts',
          component: authRequired(MainAlertsViewer)
        },
        {
          path: 'alerts/new',
          component: authRequired(ActiveAlertEditor)
        },
        {
          path: 'alerts/alert/:alertId',
          component: authRequired(ActiveAlertEditor)
        }
      )
    }

    // register routes if sign_config module enabled (unshift so they're before wildcard route)
    if (isModuleEnabled('sign_config')) {
      routes.unshift(
        {path: 'signs', component: authRequired(MainSignsViewer)},
        {
          path: 'signs/new',
          component: authRequired(ActiveSignEditor)
        },
        {
          path: 'signs/sign/:signId',
          component: authRequired(ActiveSignEditor)
        }
      )
    }

    return (
      <Router history={history}>
        {routes.map((r, i) => <Route {...r} key={i} />)}
      </Router>
    )
  }
}
