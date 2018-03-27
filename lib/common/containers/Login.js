import {connect} from 'react-redux'
import {push} from 'react-router-redux/lib/actions'

import Login from '../components/Login'
import {receiveTokenAndProfile} from '../../manager/actions/user'

const mapStateToProps = (state, ownProps) => {
  const {redirectOnSuccess} = state.user
  return {
    // If redirect URL is null, we want to default to application home.
    redirectOnSuccess: redirectOnSuccess || '/home'
  }
}

const mapDispatchToProps = {
  push,
  receiveTokenAndProfile,
  // Default onHide action is to go back to root page
  onHide: () => push('/')
}

export default connect(mapStateToProps, mapDispatchToProps)(Login)
