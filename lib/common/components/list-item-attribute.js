import Icon from '@conveyal/woonerf/components/icon'
import React, { Component, PropTypes } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

export default class Attribute extends Component {
  static propTypes = {
    className: PropTypes.string,
    icon: PropTypes.string,
    minWidth: PropTypes.string,
    text: PropTypes.string,
    title: PropTypes.string
  }
  render () {
    const { className, icon, minWidth, text, title } = this.props
    const li = (
      <li
        style={{
          minWidth: `${minWidth}px`,
          textAlign: icon ? 'center' : 'left'
        }}
        className={className}>
        {icon && <Icon type={icon} />}
        {text && ` ${text}`}
      </li>
    )
    return title
    ? <OverlayTrigger placement='bottom' overlay={<Tooltip id={title}>{title}</Tooltip>}>
      {li}
    </OverlayTrigger>
    : li
  }
}
