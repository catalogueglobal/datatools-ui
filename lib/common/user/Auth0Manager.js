import auth0 from 'auth0-js'
import Auth0Lock from 'auth0-lock'
import {browserHistory} from 'react-router'
import decode from 'jwt-decode'
import moment from 'moment'
import uuidv4 from 'uuid/v4'

import { getConfigProperty, getComponentMessages, getMessage } from '../util/config'

const clientID = process.env.AUTH0_CLIENT_ID
const domain = process.env.AUTH0_DOMAIN
const auth0client = new auth0.WebAuth({ domain, clientID })

class Auth0Manager {
  /**
   * Get an Auth0Lock instance.  If one isn't available, create it.
   * I put this here because this will get called after all the config is loaded.
   * The `this.lockOptions` variable is meant to be injected in a testing environment
   *
   * @return {Object} An auth0 lock instance
   */
  getLock () {
    if (!this.lock) {
      this.lock = new Auth0Lock(
        clientID,
        domain,
        this.lockOptions || {
          allowSignUp: false,
          auth: {
            params: {
              scope: 'app_metadata profile email openid user_metadata',
              // state: window.location.pathname
            },
            // redirectUrl: window.location.origin,
            redirect: false
          },
          autoclose: true,
          closable: false,
          languageDictionary: {
            title: getMessage(getComponentMessages('Login'), 'title')
          },
          theme: {
            logo: 'https://s3-eu-west-1.amazonaws.com/analyst-logos/conveyal-128x128.png',
            primaryColor: '#2389c9'
          }
        }
      )
    }

    return this.lock
  }

  /**
   * Use the access token (token for API calls) to get the user's profile.
   * @param  {String} accessToken auth0 access token
   * @return {Object}             auth0 profile
   */
  getProfileFromToken (accessToken) {
    return new Promise((resolve, reject) => {
      this.getLock().getProfile(idToken, (err, profile) => {
        if (err) reject(err)
        else resolve(profile)
      })
    })
  }

  /**
   * Retrieves the access token from localStorage. The access token is the
   * credential used to get the user profile from Auth0.
   * @return {String} auth0 access token
   */
  getAccessToken () {
    return window.localStorage.getItem('accessToken')
  }

  /**
   * Retrieves the ID token from localStorage. The ID token is used by the
   * application in API calls as with Bearer as the Authorization header.
   * @return {String} auth0 ID token
   */
  getIdToken () {
    return window.localStorage.getItem('idToken')
  }

  hideLock () {
    this.getLock().hide()
  }

  /**
   * Push browser to login route, set up lock listeners, and show the lock
   * widget.
   *
   * @param  {Function} [onHide=noop function]
   *   A function to perform if a user closes the lock without logging in
   * @param  {Function} [push]                  A dispatch-aware action function
   * @param  {Function} receiveTokenAndProfile  A dispatch-aware action function
   * @param  {Mixed} [redirectOnSuccess=false]
   *   The string of the route to redirect to upon login success
   */
  loginWithLock ({ onHide = () => {}, push, receiveTokenAndProfile, redirectOnSuccess = false }) {
    if (!window.location.pathname.endsWith('/login')) {
      // Store location to return to after successful login.
      // window.localStorage.setItem('randomStateValue', window.location.pathname)
      // console.log('pushing to login. will return to:', window.localStorage.getItem('randomStateValue'))
      // Redirect to /login (which must be listed as an Auth0 callback in client
      // settings).
      push('/login')
      return
    }
    const lock = this.getLock()

    // let hideFn = onHide

    // function clearOnHideFn () {
    //   hideFn = () => {}
    // }
    //
    // function registerOnHideFn () {
    //   hideFn = onHide
    // }

    // lock.on('hide', () => {
    //   hideFn()
    //   // if (typeof onHide !== 'function') {
    //   //   console.log('hiding lock!!')
    //   //   push('/')
    //   // } else {
    //   //   hideFn()
    //   // }
    // })

    lock.on('authenticated', (authResult) => {
      this.receiveAuthResult({
        authResult,
        push,
        receiveTokenAndProfile,
        redirectOnSuccess
      })
      this.hideLock()
    })

    // register these listeners to make sure the onHide function is not called
    // after a successful login
    // lock.on('signin submit', () => { clearOnHideFn() })
    // lock.on('signup submit', () => { clearOnHideFn() })
    // lock.on('authorization_error', (e) => { registerOnHideFn() })

    // Finally, show the lock widget for log in.
    lock.show()
  }

  /**
   * Log a user out from this auth0 client
   * - remove token from localStorage
   * - make a call to auth0 to logout
   */
  logout () {
    browserHistory.push('/')
    this.removeToken()
    this.getLock().logout({
      returnTo: window.location.origin
    })
  }

  /**
   * Recive an authResult and dispatch appropriate actions
   *
   * @param  {Object} authResult                The authResult
   * @param  {Action} [push]                    react-router-redux push
   * @param  {Action} receiveTokenAndProfile
   * @param  {String} [redirectOnSuccess=false] A possible route to redirect to upon success
   * @return {Mixed}                            actions
   */
  receiveAuthResult ({
    authResult,
    push,
    receiveTokenAndProfile,
    redirectOnSuccess,
    isRenewal
  }) {
    if (!authResult) return receiveTokenAndProfile()
    const {accessToken, idToken} = authResult
    this.setAccessToken(accessToken)
    this.setIdToken(idToken)
    // Get profile with access token and return profile and ID token to store.
    return this.getProfileFromToken(accessToken)
      .then(profile => {
        const actions = [
          receiveTokenAndProfile({
            token: idToken,
            profile
          })
        ]
<<<<<<< HEAD
        if (push && redirectOnSuccess) {
          actions.push(push(redirectOnSuccess))
=======
        if (push && !isRenewal) {
          if (redirectOnSuccess) {
            actions.push(push(redirectOnSuccess))
          }
>>>>>>> 9e77a4a... fix(auth0): route to '/login' for single callback log on
        }
        return actions
      })
      .catch((err) => {
        console.error('An error occurred while trying to get the user profile', err)
        this.removeTokens()
        return receiveTokenAndProfile()
      })
  }

  /**
   * Remove both access and ID tokens stored in localStorage.
   */
  removeTokens () {
    window.localStorage.removeItem('accessToken')
    window.localStorage.removeItem('idToken')
  }

  /**
   * Attempt to silently renew the session.
   *
   * @return {Promise} if successful, returns an authResult
   */
  renewAuth () {
    return new Promise((resolve, reject) => {
      const nonce = uuidv4()
      auth0client.renewAuth({
        audience: '',
        nonce,
        postMessageDataType: 'auth0:silent-authentication',
        redirectUri: window.location.origin + '/api/auth0-silent-callback',
        scope: 'openid email',
        usePostMessage: true
      }, (err, authResult) => {
        if (err) {
          console.log('Failed to renew log in.')
          reject(err)
        } else if (!authResult.idToken) {
          const err = new Error('idToken not received from auth0')
          console.log(authResult)
          reject(err)
        } else if (!nonceMatches(authResult.idToken, nonce)) {
          const err = new Error('Nonce string does not match!')
          reject(err)
        } else {
          console.log('renewed auth successfully!')
          resolve(authResult)
        }
      })
    })
  }

  /**
   * Renew session by following these steps:
   * 1. Renew the user's session if needed.
   * 2. If user token hasn't yet expired, use it.
   * 3. If token has expired, try to silently renew it.
   * 4. Logout user if session renewal fails.
   *
   * @param  {Function} receiveTokenAndProfile an action function
   * @param  {Function} logout                 an action function
   * @param  {Boolean} userIsLoggedIn
   * @return {Mixed}  Return is dependent on what actions need to happen
   */
  renewSessionIfNeeded ({
    logout,
    receiveTokenAndProfile,
    userIsLoggedIn
  }) {
    // Get the ID token if we've saved it in localStorage before
    const idToken = this.getIdToken()

    if (idToken) {
      // user has logged in before
      // check if token is expired
      if (tokenIsExpired(idToken)) {
        // FIXME: is there a need to check expiration of the access token?
        // expired, try to refresh token
        if (this.isTryingToRenewExpiredToken) return []

        this.isTryingToRenewExpiredToken = true
        console.log('token is expired. renewing.')
        return (
          this.renewAuth()
            .then((authResult) => {
              this.isTryingToRenewExpiredToken = false
              return this.receiveAuthResult({
                authResult,
                receiveTokenAndProfile,
                isRenewal: true
              })
            })
            .catch((err) => {
              this.isTryingToRenewExpiredToken = false
              console.error('an error occurred while trying to log in', err)
              return logout(userIsLoggedIn)
            })
        )
      } else {
        // token is still valid

        // see if it's been long enough to try again
        const profileRefreshTime = getConfigProperty('application.profile_refresh_time')
        if (
          userIsLoggedIn &&
          (profileRefreshTime < 0 ||
            (profileRefreshTime >= 0 && this.profileExpirationTime.isAfter(moment())))
        ) {
          return []
        } else if (profileRefreshTime >= 0) {
          this.profileExpirationTime = moment().add(profileRefreshTime, 'seconds')
        }

        if (this.isTryingToGetProfileFromToken) return []

        this.isTryingToGetProfileFromToken = true

        return this.getProfileFromToken(userToken)
          .then((profile) => {
            this.isTryingToGetProfileFromToken = false
            return receiveTokenAndProfile({
              token: idToken,
              profile
            })
          })
          .catch((err) => {
            this.isTryingToGetProfileFromToken = false
            console.error('an error occurred while trying to get the token', err)
            return logout(userIsLoggedIn)
          })
      }
    } else {
      // user hasn't logged in before
      return logout(userIsLoggedIn)
    }
  }

  resetPassword () {
    this.getLock().show({
      allowLogin: false,
      allowSignUp: false
    })
  }

  /**
   * Store the access token in local storage. The access token is the credential
   * used to get the user profile from Auth0. More info:
   * https://auth0.com/docs/tokens/access-token
   * @param {String} token Auth0 access token
   */
  setAccessToken (token) {
    window.localStorage.setItem('accessToken', token)
  }

  /**
   * Store the ID token in local storage. The ID token is used by the
   * application in API calls as with Bearer as the Authorization header. More:
   * https://auth0.com/docs/tokens/id-token
   * @param {String} token Auth0 ID token
   */
  setIdToken (token) {
    window.localStorage.setItem('idToken', token)
  }
}

/**
 * Check that the decoded token matches the nonce.
 */
function nonceMatches (token, nonce) {
  try {
    const decoded = decode(token)
    return decoded.nonce === nonce
  } catch (err) {
    console.log(err)
    return false
  }
}

/**
 * See if a token has expired
 * @param  {String}  token The auth0 token
 * @return {Boolean}       Returns true if token is expired
 */
function tokenIsExpired (token) {
  try {
    const decoded = decode(token)
    if (!decoded.exp) {
      // shouldn't happen, but assume it doesn't expire?
      return false
    }

    return (new Date()).getTime() > decoded.exp * 1000
  } catch (err) {
    console.log(err)
    return true
  }
}

const manager = new Auth0Manager()
export default manager
