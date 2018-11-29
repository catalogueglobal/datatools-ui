// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import { Row, Label, Col, Button, Table, FormControl, Glyphicon, Panel } from 'react-bootstrap'

import ActiveDeploymentViewer from '../containers/ActiveDeploymentViewer'
import ConfirmModal from '../../common/components/ConfirmModal'
import EditableTextField from '../../common/components/EditableTextField'
import Loading from '../../common/components/Loading'
import {getComponentMessages} from '../../common/util/config'
import {formatTimestamp, fromNow} from '../../common/util/date-time'
import type {Deployment, Project} from '../../types'

type Props = {
  activeSubComponent: ?string,
  createDeployment: string => void,
  deleteDeploymentConfirmed: Deployment => void,
  deployments: Array<Deployment>,
  expanded: boolean,
  fetchDeployments: () => void,
  project: Project,
  saveDeployment: any => void,
  updateDeployment: (Deployment, any) => void
}

export default class DeploymentsPanel extends Component<Props> {
  componentWillMount () {
    if (this.props.expanded) this.props.fetchDeployments()
  }

  _onDeleteDeployment = (deployment: Deployment) => {
    this.refs.confirmModal.open({
      title: 'Delete Deployment?',
      body: `Are you sure you want to delete the deployment ${deployment.name}?`,
      onConfirm: () => {
        console.log('OK, deleting')
        this.props.deleteDeploymentConfirmed(deployment)
      }
    })
  }

  render () {
    const {activeSubComponent: deploymentId, deployments, project} = this.props
    const deployment = deployments && deployments.find(d => d.id && d.id === deploymentId)
    if (deployment) {
      return (
        <ActiveDeploymentViewer
          project={project}
          deployment={deployment}
          deployments={deployments}
          feedSources={project.feedSources} />
      )
    }
    if (deploymentId && !deployments) {
      return <Loading />
    }
    return (
      <Row>
        <ConfirmModal ref='confirmModal' />
        <Col xs={9}>
          <DeploymentsList
            deleteDeployment={this._onDeleteDeployment}
            {...this.props} />
        </Col>
        <Col xs={3}>
          <Panel header={<h3>Deploying feeds to OTP</h3>}>
            <p>A collection of feeds can be deployed to OpenTripPlanner (OTP) instances that have been defined in the organization settings.</p>
            <LinkContainer to={`/project/${project.id}/settings/deployment`}>
              <Button block bsStyle='primary'>
                <Icon type='cog' /> Edit deployment settings
              </Button>
            </LinkContainer>
          </Panel>
        </Col>
      </Row>
    )
  }
}

type ListProps = {
  deleteDeployment: Deployment => void
} & Props

type State = {
  searchText?: string
}

class DeploymentsList extends Component<ListProps, State> {
  messages = getComponentMessages('DeploymentsList')
  state = {}

  _onChangeSearch = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.setState({searchText: evt.target.value})

  _onClickNewDeployment = () => this.props.createDeployment(this.props.project.id)

  render () {
    const {deployments} = this.props
    const {searchText} = this.state
    const visibleDeployments: Array<Deployment> = deployments
      ? deployments.filter(
        deployment =>
          deployment.name
            .toLowerCase()
            .indexOf((searchText || '').toLowerCase()) !== -1
      )
      : []
    return (
      <Panel
        header={
          <Row>
            <Col xs={4}>
              <FormControl
                placeholder={this.messages('search')}
                onChange={this._onChangeSearch} />
            </Col>
            <Col xs={8}>
              <Button
                bsStyle='success'
                // disabled={projectEditDisabled}
                className='pull-right'
                onClick={this._onClickNewDeployment}>
                <Glyphicon glyph='plus' /> {this.messages('new')}
              </Button>
            </Col>
          </Row>
        }>
        <Table striped hover fill>
          <thead>
            <tr>
              <th className='col-md-4'>{this.messages('table.name')}</th>
              <th>{this.messages('table.creationDate')}</th>
              <th>{this.messages('table.lastDeployed')}</th>
              <th>{this.messages('table.deployedTo')}</th>
              <th>{this.messages('table.feedCount')}</th>
              <th>{this.messages('table.testDeployment')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visibleDeployments.map((deployment, index) => (
              <DeploymentListItem
                key={deployment.id || 'new-deployment-' + Math.random()}
                deployment={deployment}
                {...this.props} />
            ))}
          </tbody>
        </Table>
      </Panel>
    )
  }
}

type RowProps = {
  deployment: Deployment
} & ListProps

class DeploymentListItem extends Component<RowProps> {
  _onChangeName = (name) => {
    const {deployment, saveDeployment, project, updateDeployment} = this.props
    if (deployment.isCreating) saveDeployment({projectId: project.id, name})
    else updateDeployment(deployment, {name})
  }

  _onClickDelete = () => this.props.deleteDeployment(this.props.deployment)

  render () {
    const {deployment} = this.props
    const na = (<span style={{ color: 'lightGray' }}>N/A</span>)
    return (
      <tr>
        <td>
          <EditableTextField
            isEditing={(deployment.isCreating === true)}
            value={deployment.name}
            rejectEmptyValue
            onChange={this._onChangeName}
            link={`/project/${deployment.project.id}/deployments/${deployment.id}`} />
        </td>
        <td>
          {deployment.dateCreated
            ? <span title={formatTimestamp(deployment.dateCreated)}>
              {' '}
              {fromNow(deployment.dateCreated)}
            </span>
            : na
          }
        </td>
        <td>
          {deployment.lastDeployed
            ? <span title={formatTimestamp(deployment.lastDeployed)}>
              {fromNow(deployment.lastDeployed)}
            </span>
            : na
          }
        </td>
        <td>
          {deployment.deployedTo
            ? <Label>{deployment.deployedTo}</Label>
            : na
          }
        </td>
        <td>
          {deployment.feedVersions
            ? <span>{deployment.feedVersions.length}</span>
            : na
          }
        </td>
        <td>
          {deployment.routerId
            ? 'Yes'
            : na
          }
        </td>
        <td>
          <Button
            bsStyle='danger'
            bsSize='xsmall'
            className='pull-right'
            onClick={this._onClickDelete}>
            <Glyphicon glyph='remove' />
          </Button>
        </td>
      </tr>
    )
  }
}
