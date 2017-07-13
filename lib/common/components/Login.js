import {Component, PropTypes} from 'react'

import auth0 from '../user/Auth0Manager'

export default class Auth0 extends Component {
  static propTypes = {
    onHide: PropTypes.func,
    receiveAuthResult: PropTypes.func.isRequired
  }

  componentDidMount () {
    auth0.loginWithLock(this.props)
  }

  render () {
    return null
  }
}
