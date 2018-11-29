// @flow

import * as React from 'react'
import {connect} from 'react-redux'
import {Grid, Row, Col} from 'react-bootstrap'
import {Link} from 'react-router'

import PublicPage from '../../public/components/PublicPage'
import type {AppState, ManagerUserState} from '../../types/reducers'

import ManagerPage from './ManagerPage'

class PageNotFound extends React.Component<{user: ManagerUserState}> {
  render () {
    const {user} = this.props
    // Return content in public wrapper or manager app wrapper depending on
    // whether user logged in.
    const component = user.profile ? ManagerPage : PublicPage
    return React.createElement(component, {ref: 'page'},
      <Grid>
        <Row>
          <Col xs={12}>
            <h1>Page Not Found.</h1>
            <p>
              Go to{' '}
              <Link to={`/${user.profile ? 'home' : ''}`}>home page</Link>
            </p>
          </Col>
        </Row>
      </Grid>
    )
  }
}

const mapStateToProps = (state: AppState, ownProps) => {
  return {
    user: state.user
  }
}

const mapDispatchToProps = {}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PageNotFound)
