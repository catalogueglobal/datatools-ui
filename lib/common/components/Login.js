import {Component, PropTypes} from 'react'

import auth0 from '../user/Auth0Manager'

export default class Auth0 extends Component {
  static propTypes = {
    onHide: PropTypes.func,
    push: PropTypes.func.isRequired,
    receiveTokenAndProfile: PropTypes.func.isRequired,
    redirectOnSuccess: PropTypes.string
  }

  componentDidMount () {
    // Show lock when component mounts. NOTE: render method returns null.
    auth0.loginWithLock(this.props)
  }

  componentWillUnmount () {
    // Hide lock when component unmounts
    auth0.hideLock()
  }

  render () {
    return null
  }
}
