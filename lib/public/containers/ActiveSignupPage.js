import { connect } from 'react-redux'

import SignupPage from '../components/SignupPage'
import { createPublicUser } from '../../manager/actions/user'

const mapStateToProps = () => ({})

const mapDispatchToProps = {
  createPublicUser
}

const ActiveUserAccount = connect(
  mapStateToProps,
  mapDispatchToProps
)(SignupPage)

export default ActiveUserAccount
