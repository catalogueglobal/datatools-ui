import React, {PropTypes, Component} from 'react'
import {Col, ListGroupItem, Row} from 'react-bootstrap'

export default class CollapsibleListGroupItem extends Component {
  static propTypes = {
    children: PropTypes.object.isRequired,
    expanded: PropTypes.boolean
  }

  // static defaultProps = {
  //   expanded: false
  // }

  state = {
    expanded: false
  }

  _onClick = () => this.setState({expanded: !this.state.expanded})

  render () {
    const {children, heading} = this.props
    const {expanded} = this.state
    return (
      <ListGroupItem
        {...this.props}
        onClick={this._onClick}
      >
        <Row className='list-group-item-heading'>
          <Col xs={12}>
            {heading}
          </Col>
        </Row>
        {expanded ? children : null}
      </ListGroupItem>
    )
  }
}
