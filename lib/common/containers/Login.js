import { connect } from 'react-redux'

import Login from '../components/Login'
import { receiveAuthResult } from '../../manager/actions/user'

function mapStateToProps () { return {} }

const mapDispatchToProps = {
  receiveAuthResult
}

export default connect(mapStateToProps, mapDispatchToProps)(Login)
