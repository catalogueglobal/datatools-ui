import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import Login from '../components/Login'
import { receiveAuthResult } from '../../manager/actions/user'

function mapStateToProps () { return {} }

const mapDispatchToProps = {
  receiveAuthResult
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Login))
