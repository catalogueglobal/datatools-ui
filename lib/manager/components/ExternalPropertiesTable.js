// @flow

import React, {Component} from 'react'
import { Panel, Table } from 'react-bootstrap'

import EditableTextField from '../../common/components/EditableTextField'
import type {Feed} from '../../types'

type Props = {
  editingIsDisabled: ?boolean,
  externalPropertyChanged: (Feed, string, any) => void,
  feedSource: Feed,
  isProjectAdmin: ?boolean,
  resourceProps: any,
  resourceType: string
}

export default class ExternalPropertiesTable extends Component<Props> {
  render () {
    const {
      feedSource,
      resourceProps,
      resourceType
    } = this.props
    return (
      <Panel
        header={<h3>{resourceType} properties</h3>}>
        <Table striped fill>
          <thead>
            <tr>
              <th className='col-md-4'>Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(resourceProps).sort().map((propName, index) => (
              <ExternalProperty
                {...this.props}
                key={propName}
                feedSource={feedSource}
                value={resourceProps[propName]}
                resourceType={resourceType}
                name={propName} />
            ))}
          </tbody>
        </Table>
      </Panel>
    )
  }
}

type PropertyProps = {
  editingIsDisabled: ?boolean,
  externalPropertyChanged: (Feed, string, any) => void,
  feedSource: Feed,
  isProjectAdmin: ?boolean,
  name: string,
  resourceType: string,
  value: string
}

class ExternalProperty extends Component<PropertyProps> {
  _onChange = (value) => {
    const {externalPropertyChanged, feedSource, name, resourceType} = this.props
    externalPropertyChanged(feedSource, resourceType, {[name]: value})
  }

  render () {
    const {editingIsDisabled, isProjectAdmin, name, resourceType, value} = this.props
    const disabled = resourceType === 'MTC' && name === 'AgencyId'
      ? !isProjectAdmin
      : editingIsDisabled
    return (
      <tr>
        <td>{name}</td>
        <td>
          <EditableTextField
            disabled={disabled}
            value={value}
            onChange={this._onChange} />
        </td>
      </tr>
    )
  }
}
