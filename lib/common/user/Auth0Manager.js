import auth0 from 'auth0-js'
import Auth0Lock from 'auth0-lock'
import decode from 'jwt-decode'
import uuidv4 from 'uuid/v4'

import { getComponentMessages, getMessage } from '../util/config'

const auth0client = new auth0.WebAuth({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID
})

class Auth0Manager {
  /**
   * See if the user is logged in and get most recent user data.
   *
   * @param  {Function} callback Called with (err, authResult)
   *   authResult can be null if user is a first-time visitor
   */
  checkLogin (callback) {
    // Get the user token if we've saved it in localStorage before
    const userToken = this.getToken()

    if (userToken) {
      // user has logged in before
      // check if token is expired
      if (tokenIsExpired(userToken)) {
        // expired, try to refresh token
        this.renewAuth(callback)
      } else {
        // still valid, get profile info again
        this.getLock().getProfile(userToken, callback)
      }
    } else {
      // user hasn't logged in before
      callback(null, null)
    }
  }

  /**
   * Get an Auth0Lock instance.  If one isn't available, create it.
   * I put this here because this will get called after all the config is loaded.
   *
   * @return {Object} An auth0 lock instance
   */
  getLock () {
    if (!this.lock) {
      this.lock = new Auth0Lock(
        process.env.AUTH0_CLIENT_ID,
        process.env.AUTH0_DOMAIN,
        {
          allowSignUp: false,
          auth: {
            params: {
              scope: 'app_metadata openid email user_metadata'
            },
            redirect: false
          },
          autoclose: true,
          closable: true,
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

  getProfile (idToken, callback) {
    this.getLock().getProfile(idToken, callback)
  }

  getToken () {
    // Retrieves the user token from localStorage
    return window.localStorage.getItem('userToken')
  }

  hideLock () {
    this.getLock().hide()
  }

  loginWithLock ({ history, onHide, receiveTokenAndProfile, redirectOnSuccess }) {
    const lock = this.getLock()

    if (typeof onHide === 'function') {
      lock.on('hide', onHide)
    }

    lock.on('authenticated', (authResult) => {
      if (!authResult) {
        return receiveTokenAndProfile()
      }

      this.getProfile(authResult.idToken, (error, profile) => {
        if (error) {
          receiveTokenAndProfile()
        } else {
          if (redirectOnSuccess) {
            history.push(redirectOnSuccess)
          }
          receiveTokenAndProfile({
            token: authResult.idToken,
            profile
          })
        }
      })
    })

    lock.show()
  }

  logout () {
    window.localStorage.removeItem('userToken')
    var redirect = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '')
    window.location.replace('https://' + this.props.domain + '/v2/logout?returnTo=' + redirect)
  }

  renewAuth (callback) {
    const nonce = uuidv4()
    auth0client.renewAuth({
      audience: '',
      nonce,
      postMessageDataType: 'auth0:silent-authentication',
      redirectUri: window.location.origin + '/auth0-silent-callback',
      scope: 'openid app_metadata user_metadata email profile',
      usePostMessage: true
    }, (err, authResult) => {
      if (err) {
        console.log('Failed to renew log in.')
        callback(err)
      } else if (!authResult.idToken) {
        const err = new Error('idToken not received from auth0')
        console.log(authResult)
        callback(err)
      } else if (nonceMathces(authResult.idToken, nonce)) {
        const err = new Error('Nonce string does not match!')
        callback(err)
      } else {
        console.log('renewed auth successfully!')
        callback(null, authResult)
      }
    })
  }

  resetPassword () {
    this.getLock().showReset((err) => {
      if (!err) this.getLock().hide()
    })
  }
}

/**
 * See if a token has expired
 * @param  {String}  token The auth0 token
 * @return {Boolean}       Returns true if token is expired
 */
function tokenIsExpired (token) {
  const decoded = decode(token)
  if (!decoded.exp) {
    // shouldn't happen, but assume it doesn't expire?
    return false
  }

  return (new Date()).getTime() > decoded.exp * 1000
}

function nonceMathces (token, nonce) {
  const decoded = decode(token)
  return decoded.nonce === nonce
}

const manager = new Auth0Manager()
export default manager
