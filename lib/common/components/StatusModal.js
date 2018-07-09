import React, {Component, PropTypes} from 'react'
import {Modal, Button} from 'react-bootstrap'

import Login from '../containers/Login'

export default class StatusModal extends Component {
  static propTypes = {
    title: PropTypes.string,
    body: PropTypes.string,
    action: PropTypes.string,
    onConfirm: PropTypes.func
  }

  state = {
    showLogin: false,
    showModal: false
  }

  componentWillReceiveProps (newProps) {
    if (newProps.title) {
      this.setState({
        showModal: true,
        ...newProps
      })
    }
  }

  close = () => {
    this.setState({
      showModal: false
    })
    this.props.clearStatusModal()
  }

  _onLoginClick = () => {
    this.setState({
      showLogin: true,
      showModal: false
    })
  }

  _onLoginHide = () => {
    this.setState({ showLogin: false })
  }

  open (props) {
    this.setState({
      showModal: true,
      ...props
    })
  }

  _renderAction = (action) => {
    switch (action) {
      case 'LOG_IN':
        return <Button bsStyle='primary' onClick={this._onLoginClick}>Log in</Button>
      default:
        return null
    }
  }

  render () {
    const {Body, Footer, Header, Title} = Modal
    const {title, body, action} = this.state
    return (
      <Modal
        show={this.state.showModal}
        onHide={this.close}>
        <Header>
          <Title>{title}</Title>
        </Header>
        <Body>
          <p style={{whiteSpace: 'pre-wrap'}}>{body}</p>
        </Body>
        <Footer>
          {this._renderAction(action)}
          <Button onClick={this.close}>Close</Button>
        </Footer>
        {/*
          FIXME: This may need to be fixed. Instead of setting state, push to
          '/login' on log in button click above.
        */}
        {this.state.showLogin &&
          <Login onHide={this._onLoginHide} />
        }
      </Modal>
    )
  }
}
