import { connect } from 'react-redux'

import Login from '../components/Login'
import { receiveTokenAndProfile } from '../../manager/actions/user'

function mapStateToProps () { return {} }

const mapDispatchToProps = {
  receiveTokenAndProfile
}

export default connect(mapStateToProps, mapDispatchToProps)(Login)
