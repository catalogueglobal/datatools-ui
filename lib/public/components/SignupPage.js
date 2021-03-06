// @flow

import React, {Component} from 'react'
import { Grid, Row, Col, Button, FormControl, FormGroup, ControlLabel } from 'react-bootstrap'

import Login from '../../common/containers/Login'
import * as userActions from '../../manager/actions/user'
import PublicPage from './PublicPage'

import type {Props as ContainerProps} from '../containers/ActiveSignupPage'

type Props = ContainerProps & {
  createPublicUser: typeof userActions.createPublicUser
}

type State = {
  showLogin: boolean
}

export default class SignupPage extends Component<Props, State> {
  state = { showLogin: false }

  _onChange = ({target}: SyntheticInputEvent<HTMLInputElement>) =>
    this.setState({[target.name]: target.value})

  _onClickSignUp = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.props.createPublicUser(this.state)
  }

  _onLoginClick = () => {
    this.setState({ showLogin: true })
  }

  _onLoginHide = () => {
    this.setState({ showLogin: false })
  }

  render () {
    const email = (
      <FormGroup controlId='formControlsEmail'>
        <ControlLabel>Email</ControlLabel>
        <FormControl
          type='email'
          name='email'
          placeholder='user@example.com'
          onChange={this._onChange} />
      </FormGroup>
    )
    const password = (
      <FormGroup controlId='formControlsPassword'>
        <ControlLabel>Password</ControlLabel>
        <FormControl
          type='password'
          name='password'
          placeholder='password'
          onChange={this._onChange} />
      </FormGroup>
    )
    return (
      <PublicPage ref='publicPage'>
        <Grid>
          <Row>
            <Col xs={12}>
              <h2>
                Create an account
              </h2>
              <p className='alert alert-danger'>Warning! This feature is no longer maintained!</p>
            </Col>
          </Row>
          <Row>
            <Col xs={4}>
              <form>
                <p>
                  Already have an account?
                  {' '}
                  <Button
                    href='#'
                    bsStyle='link'
                    onClick={this._onLoginClick}>
                    Sign in
                  </Button>
                </p>
                {/* username */}
                {email}
                {password}
                <Button
                  bsStyle='primary'
                  onClick={this._onClickSignUp}>
                  Sign up!
                </Button>
              </form>
            </Col>
          </Row>
        </Grid>
        {/* FIXME: This is no longer maintained and needs to be fixed. */}
        {this.state.showLogin &&
          <Login
            onHide={this._onLoginHide}
            redirectOnSuccess='/home'
          />
        }
      </PublicPage>
    )
  }
}
