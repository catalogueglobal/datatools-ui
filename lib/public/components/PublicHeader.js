// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Grid, Row, Col, Button, Glyphicon, ButtonToolbar} from 'react-bootstrap'
import {LinkContainer} from 'react-router-bootstrap'

import {isModuleEnabled} from '../../common/util/config'
import * as userActions from '../../manager/actions/user'

import type {Props as ContainerProps} from '../containers/ActivePublicHeader'

type Props = ContainerProps & {
  logout: typeof userActions.logout,
  title: string,
  userPicture: ?string,
  username: ?string
}

type State = {
  showLogin: boolean
}

export default class PublicHeader extends Component<Props, State> {
  state = { showLogin: false }

  _onLoginClick = () => {
    this.setState({ showLogin: true })
  }

  _onLoginHide = () => {
    this.setState({ showLogin: false })
  }

  _onLogoutClick = () => {
    this.props.logout()
  }

  render () {
    const {title, username, userPicture} = this.props
    return (
      <Grid>
        <Row style={{marginBottom: 20, marginTop: 40}}>
          {/* Title Column */}
          <Col xs={6}>
            <h1 style={{marginTop: 0}}>
              {title}
            </h1>
          </Col>
          {/* Button Column */}
          <Col xs={6} style={{paddingTop: 2}}>
            <ButtonToolbar className='pull-right'>
              {/* TODO: Add Language Selector */}
              {/* "Log In" Button or User Dropdown */}
              {username
                ? (
                  <LinkContainer to='/home'>
                    <Button>
                      <span>
                        <img
                          alt='User'
                          height={20}
                          width={20}
                          src={userPicture}
                        />{' '}
                        My dashboard
                      </span>
                    </Button>
                  </LinkContainer>
                )
                : (
                  <LinkContainer to='/login'>
                    <Button
                      bsStyle='primary'
                      data-test-id='header-log-in-button'
                    >
                      <Glyphicon glyph='log-in' /> Log In
                    </Button>
                  </LinkContainer>
                )
              }
              {/* "Create Account" Button (only show if no active user) */}
              {!username && !isModuleEnabled('enterprise')
                ? (
                  <LinkContainer to='/signup'>
                    <Button bsStyle='success'>
                      <Glyphicon glyph='plus' /> Create Account
                    </Button>
                  </LinkContainer>
                )
                : null
              }
              {/* "Log out" Button */}
              {username
                ? (
                  <Button bsStyle='primary' onClick={this._onLogoutClick}>
                    <Icon type='sign-out' /> Log Out
                  </Button>
                )
                : null}
            </ButtonToolbar>
          </Col>
        </Row>
      </Grid>
    )
  }
}
