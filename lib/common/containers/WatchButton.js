// @flow

import React, {Component} from 'react'
import {Button, Glyphicon, MenuItem} from 'react-bootstrap'
import {connect} from 'react-redux'

import {updateTargetForSubscription} from '../../manager/actions/user'
import {getComponentMessages, getConfigProperty} from '../util/config'
import type {AppState, ManagerUserState} from '../../types/reducers'

type Props = {
  componentClass?: string,
  isWatching: ?boolean,
  subscriptionType: string,
  target: string,
  updateTarget: typeof updateTargetForSubscription,
  user: ManagerUserState
}

class WatchButton extends Component<Props> {
  messages = getComponentMessages('WatchButton')

  _onToggleWatch = () => {
    const {updateTarget, user, target, subscriptionType} = this.props
    if (user.profile) updateTarget(user.profile, target, subscriptionType)
    else console.warn('User profile not found. Cannot update subscription', user)
  }

  _getLabel = () => {
    const {isWatching} = this.props
    return (
      <span>
        <Glyphicon glyph={`eye-${isWatching ? 'close' : 'open'}`} />{' '}
        {this.messages(isWatching ? 'unwatch' : 'watch')}
      </span>
    )
  }

  render () {
    const {componentClass} = this.props
    // Do not render watch button if notifications are not enabled.
    if (!getConfigProperty('application.notifications_enabled')) return null
    switch (componentClass) {
      case 'menuItem':
        return (
          <MenuItem
            onClick={this._onToggleWatch}>
            {this._getLabel()}
          </MenuItem>
        )
      default:
        return (
          <Button
            onClick={this._onToggleWatch}>
            {this._getLabel()}
          </Button>
        )
    }
  }
}

const mapDispatchToProps = {
  updateTarget: updateTargetForSubscription
}

const mapStateToProps = (state: AppState, ownProps) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WatchButton)
