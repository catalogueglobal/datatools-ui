import React, { PropTypes, Component } from 'react'
import {ListGroupItem} from 'react-bootstrap'

import AlertPreview from './AlertPreview'
import Loading from '../../common/components/Loading'
import SortableListGroup from '../../common/components/sortable-list-group'
import { FILTERS, SORT_OPTIONS } from '../util'

export default class AlertsList extends Component {
  static propTypes = {
    agencyFilterChanged: PropTypes.func,
    alerts: PropTypes.array,
    editableFeeds: PropTypes.array,
    feeds: PropTypes.array,
    fetched: PropTypes.bool,
    filterCounts: PropTypes.object,
    isFetching: PropTypes.bool,
    onDeleteClick: PropTypes.func,
    onEditClick: PropTypes.func,
    onZoomClick: PropTypes.func,
    publishableFeeds: PropTypes.array,
    searchTextChanged: PropTypes.func,
    sortChanged: PropTypes.func,
    visibilityFilter: PropTypes.object,
    visibilityFilterChanged: PropTypes.func
  }

  _onAgencyFilterChange = (evt) => {
    this.props.agencyFilterChanged(evt.target.value)
  }

  _clearFilters = () => {
    this.props.agencyFilterChanged('')
    this.props.searchTextChanged('')
  }

  _onSearchChange = evt => this.props.searchTextChanged(evt.target.value)

  render () {
    const {
      alerts,
      editableFeeds,
      feeds,
      filterCounts,
      visibilityFilter,
      visibilityFilterChanged,
      fetched,
      isFetching,
      onDeleteClick,
      onEditClick,
      onZoomClick,
      publishableFeeds,
      sortChanged
    } = this.props
    return (
      <SortableListGroup
        filters={FILTERS}
        feeds={feeds}
        filterCounts={filterCounts}
        feedId={visibilityFilter.feedId}
        filter={visibilityFilter.filter}
        onFilterChange={visibilityFilterChanged}
        messages={{
          new: 'New alert',
          search: 'Search Alerts'
        }}
        searchText={visibilityFilter.searchText}
        sortOptions={SORT_OPTIONS}
        sort={visibilityFilter.sort}
        onSortChange={sortChanged}
        onSearchChange={this._onSearchChange}
        onFeedFilterChange={this._onAgencyFilterChange}
        children={isFetching || !fetched
          ? <Loading />
          : alerts.length
            ? alerts.map(alert => (
              <AlertPreview
                alert={alert}
                key={alert.id}
                editableFeeds={editableFeeds}
                publishableFeeds={publishableFeeds}
                onEditClick={onEditClick}
                onZoomClick={onZoomClick}
                onDeleteClick={onDeleteClick} />
            ))
            : <ListGroupItem className='lead text-center'>No alerts found.</ListGroupItem>
        }
      />
    )
  }
}
