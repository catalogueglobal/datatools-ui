import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import moment from 'moment'
import { ListGroupItem, Row, Col, Button, Panel } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { Link } from 'react-router'

import ActiveDeploymentViewer from '../containers/ActiveDeploymentViewer'
import ConfirmModal from '../../common/components/ConfirmModal'
import EditableTextField from '../../common/components/EditableTextField'
import ListItemAttribute from '../../common/components/list-item-attribute'
import Loading from '../../common/components/Loading'
import SortableListGroup from '../../common/components/sortable-list-group'
import { getComponentMessages, getMessage } from '../../common/util/config'
import {formatTimestamp, fromNow} from '../../common/util/date-time'

const FILTERS = ['ALL', 'DEPLOYED', 'TEST', 'ARCHIVED']

const SORT_OPTIONS = [
  {value: 'lastDeployed:asc', label: 'Date deployed'},
  {value: 'lastDeployed:desc', label: 'Date deployed (reverse)'},
  {value: 'dateCreated:desc', label: 'Newest'},
  {value: 'dateCreated:asc', label: 'Oldest'},
  {value: 'name:asc', label: 'Name'},
  {value: 'name:desc', label: 'Name (reverse)'}
]

export default class DeploymentsPanel extends Component {
  static propTypes = {
    deployments: PropTypes.array,
    deleteDeploymentConfirmed: PropTypes.func,
    fetchDeployments: PropTypes.func,
    createDeployment: PropTypes.func,
    saveDeployment: PropTypes.func,
    updateDeployment: PropTypes.func,
    expanded: PropTypes.bool,
    project: PropTypes.object
  }

  // TODO: move filters to store
  state = {
    filter: FILTERS[0],
    sort: {
      type: 'lastDeployed',
      direction: 'desc'
    }
  }

  componentWillMount () {
    if (this.props.expanded) this.props.fetchDeployments()
  }

  _filterDeployments = (deployments, visibility) => {
    let sortedDeployments
    if (visibility.sort) {
      const sortAscending = visibility.sort.direction === 'asc'
      sortedDeployments = deployments.sort((a, b) => {
        var aValue = visibility.sort.type === 'name' ? a[visibility.sort.type].toUpperCase() : a[visibility.sort.type]
        var bValue = visibility.sort.type === 'name' ? b[visibility.sort.type].toUpperCase() : b[visibility.sort.type]
        if (aValue < bValue) return sortAscending ? -1 : 1
        if (aValue > bValue) return sortAscending ? 1 : -1
        return 0
      })
    }
    return this.filterDeploymentsByCategory(sortedDeployments, visibility.filter)
      .filter(d => d.isCreating || d.name.toLowerCase().indexOf((visibility.searchText || '').toLowerCase()) !== -1)
  }

  filterDeploymentsByCategory = (deployments, filter) => {
    switch (filter) {
      case 'ALL':
        return deployments
      case 'TEST':
        return deployments.filter((deployment) => deployment.feedSourceId !== null)
      case 'DEPLOYED':
        return deployments.filter((deployment) => deployment.deployedTo !== null)
      case 'ARCHIVED':
        return deployments.filter((deployment) => deployment.deployedTo === null)
      case 'DRAFT':
        return deployments.filter((deployment) => !deployment.published)
      default:
        return deployments
    }
  }

  _onFilterChange = filter => this.setState({filter})

  _onSearchChange = evt => this.setState({searchText: evt.target.value})

  _onSortChange = sort => this.setState({sort})

  _onDeleteDeployment = (deployment) => {
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
    console.log(this.state)
    const {
      activeSubComponent: deploymentId,
      deployments: unfilteredDeployments,
      onNewDeploymentClick,
      project
    } = this.props
    // TODO: move filters to store and use selectors to get deployments
    const {filter, searchText, sort} = this.state
    if (!unfilteredDeployments) {
      // If still loading deployments list, show spinner.
      return <Loading />
    }
    const deployment = unfilteredDeployments.find(d => d.id && d.id === deploymentId)
    if (deployment) {
      // If single deployment is active, show single deployment view.
      return (
        <ActiveDeploymentViewer
          project={project}
          deployment={deployment}
          feedSources={project.feedSources} />
      )
    }
    // If no deployment is active, show list of deployments.
    const deployments = this._filterDeployments(unfilteredDeployments, this.state)
    const listItems = []
    if (deployments.length) {
      listItems.push(
        deployments.map((deployment, index) => (
          <DeploymentListItem
            key={deployment.id || 'new-deployment-' + Math.random()}
            deployment={deployment}
            {...this.props} />
        ))
      )
    } else {
      listItems.push(
        <ListGroupItem key='no-deployments' className='lead text-center'>
          No deployments found.
        </ListGroupItem>
      )
    }
    if (deploymentId && !deployments) {
      return <Loading />
    }
    return (
      <Row>
        <ConfirmModal ref='confirmModal' />
        <Col xs={8}>
          <SortableListGroup
            filters={FILTERS}
            // feeds={feeds}
            // filterCounts={filterCounts}
            // feedId={visibilityFilter.feedId}
            filter={filter}
            sort={sort}
            onFilterChange={this._onFilterChange}
            searchText={searchText}
            messages={{new: 'New deployment'}}
            sortOptions={SORT_OPTIONS}
            onClickNew={onNewDeploymentClick}
            onSortChange={this._onSortChange}
            onSearchChange={this._onSearchChange}
            // onAgencyFilterChange={this._onAgencyFilterChange}
            children={listItems}
           />
        </Col>
        <Col xs={4}>
          <Panel header={<h3>Deploying feeds to OTP</h3>}>
            <p>A collection of feeds can be deployed to OpenTripPlanner (OTP)
            instances that have been defined in the organization settings.</p>
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

class DeploymentListItem extends Component {
  _onChangeName = (name) => {
    const {deployment, saveDeployment, project, updateDeployment} = this.props
    if (deployment.isCreating) saveDeployment({projectId: project.id, name})
    else updateDeployment(deployment, {name})
  }

  _onClickDelete = () => this.props.deleteDeployment(this.props.deployment)

  render () {
    const {deployment} = this.props
    const {
      isCreating,
      name,
      project,
      id,
      dateCreated,
      lastDeployed,
      deployedTo
    } = deployment
    const ALERT_DATE_FORMAT = 'MMM Do YYYY, h:mm:ssa'
    const na = (<span style={{ color: 'lightGray' }}>N/A</span>)
    const hasErrors = true
    const hasVersion = false
    return (
      <ListGroupItem>
        <p style={{margin: 0}}>
          {isCreating
            ? <EditableTextField
              isEditing={(isCreating === true)}
              inline
              value={name}
              onChange={this._onChangeName}
              link={`/project/${project.id}/deployments/${id}`} />
            : <strong>
              <Link to={`/project/${project.id}/deployments/${id}`}>
                {name}
              </Link>
            </strong>
          }
        </p>
        {!isCreating &&
          <ul
            className='list-inline small'
            style={{marginBottom: '0px'}}>
            <ListItemAttribute
              icon={hasErrors ? 'exclamation-triangle' : hasVersion ? 'check' : 'circle-o'}
              className={hasErrors ? 'text-warning' : hasVersion ? 'text-success' : 'text-muted'}
              text={hasErrors}// && feedSource.latestValidation.errorCount}
              title={hasErrors ? `Latest version has [blank] errors` : hasVersion ? 'Latest version is issue free!' : null}
              minWidth={40} />
            <span title={`Alert #${id} created on ${moment(dateCreated).format(ALERT_DATE_FORMAT)}`}>
              #{id} <span className='text-success' title='Published'><Icon type='check-square-o' /></span>
            </span>
            {' '}
            {dateCreated
              ? <span>
                Created <span title={moment(dateCreated).format('MMM Do YYYY')}>
                  {moment(dateCreated).fromNow()}
                </span> by some user
              </span>
              : na
            }
            {lastDeployed
              ? <span>
                Deployed <span title={moment(lastDeployed).format('MMM Do YYYY')}>
                  {moment(lastDeployed).fromNow()}
                </span> to {deployedTo}
              </span>
              : na
            }
          </ul>
        }
      </ListGroupItem>
    )
  }
}
