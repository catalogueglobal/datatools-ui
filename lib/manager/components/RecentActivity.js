import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import moment from 'moment'
import { Link } from 'react-router-dom'

import { getProfileLink } from '../../common/util/util'

export default class RecentActivity extends Component {
  static propTypes = {
    item: PropTypes.object
  }
  render () {
    const { item } = this.props
    const containerStyle = {
      marginTop: 10,
      paddingBottom: 12,
      borderBottom: '1px solid #ddd'
    }

    const iconStyle = {
      float: 'left',
      fontSize: 20,
      color: '#bbb'
    }

    const dateStyle = {
      color: '#999',
      fontSize: 11,
      marginBottom: 2
    }

    const innerContainerStyle = {
      marginLeft: 36
    }

    const commentStyle = {
      backgroundColor: '#f0f0f0',
      marginTop: 8,
      padding: 8,
      fontSize: 12
    }

    switch (item.type) {
      case 'feed-commented-on':
        return (
          <div style={containerStyle}>
            <div style={iconStyle}>
              <Icon type='comment' />
            </div>
            <div style={innerContainerStyle}>
              <div style={dateStyle}>{moment(item.date).fromNow()}</div>
              <div><a href={getProfileLink(item.userName)}><b>{item.userName}</b></a> commented on feed <Link to={`/feed/${item.targetId}`}><b>{item.targetName}</b></Link>:</div>
              <div style={commentStyle}><i>{item.body}</i></div>
            </div>
          </div>
        )
    }
  }
}
