// @flow

import React, {Component} from 'react'
import {
  Row,
  Col,
  Button,
  ButtonGroup,
  FormControl,
  FormGroup,
  Badge,
  ControlLabel
} from 'react-bootstrap'

import Loading from '../../common/components/Loading'
import OptionButton from '../../common/components/OptionButton'
import { getFeedId } from '../../common/util/modules'
import toSentenceCase from '../../common/util/to-sentence-case'
import { FILTERS, SORT_OPTIONS } from '../util'
import type {Alert, Feed} from '../../types'
import type {AlertFilter} from '../../types/reducers'

import AlertPreview from './AlertPreview'

type Props = {
  agencyFilterChanged: string => void,
  alerts: Array<Alert>,
  editableFeeds: Array<Feed>,
  feeds: Array<Feed>,
  fetched: boolean,
  filterCounts: {[string]: number},
  isFetching: boolean,
  onDeleteClick: Alert => void,
  onEditClick: Alert => void,
  publishableFeeds: Array<Feed>,
  searchTextChanged: string => void,
  sortChanged: ({direction: string, type: string}) => void,
  visibilityFilter: AlertFilter,
  visibilityFilterChanged: any => void
}

export default class AlertsList extends Component<Props> {
  _onAgencyFilterChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.props.agencyFilterChanged(evt.target.value)
  }

  _clearFilters = () => {
    this.props.agencyFilterChanged('')
    this.props.searchTextChanged('')
  }

  _onSearchChange = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.searchTextChanged(evt.target.value)

  _onSortChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const values: Array<string> = evt.target.value.split(':')
    const sort = {
      type: values[0],
      direction: values[1]
    }
    this.props.sortChanged(sort)
  }

  render () {
    const {
      alerts,
      editableFeeds,
      feeds,
      fetched,
      filterCounts,
      isFetching,
      onDeleteClick,
      onEditClick,
      publishableFeeds,
      visibilityFilter,
      visibilityFilterChanged
    } = this.props
    const {sort} = visibilityFilter
    const hasFilter = !!(visibilityFilter.searchText || visibilityFilter.feedId)
    return (
      <div>
        <Row>
          <Col xs={12}>
            <FormGroup>
              <FormControl
                type='text'
                placeholder='Search Alerts'
                onChange={this._onSearchChange}
                value={visibilityFilter.searchText || ''} />
            </FormGroup>
          </Col>
        </Row>
        {/* Alert filters */}
        <Row>
          <Col xs={12}>
            <FormGroup>
              <ButtonGroup justified>
                {FILTERS.map(f => (
                  <OptionButton
                    active={visibilityFilter.filter === f}
                    onClick={visibilityFilterChanged}
                    value={f}
                    key={f}>
                    {toSentenceCase(f)}{' '}
                    <Badge
                      style={{backgroundColor: '#babec0'}}>
                      {filterCounts[f]}
                    </Badge>
                  </OptionButton>
                ))}
              </ButtonGroup>
            </FormGroup>
            <FormGroup
              className='form-inline pull-right'
              controlId='formControlsSelectMultiple'>
              <ControlLabel>Sort by</ControlLabel>
              {'  '}
              <FormControl
                componentClass='select'
                value={sort && `${sort.type}:${sort.direction}`}
                onChange={this._onSortChange}>
                {SORT_OPTIONS.map(option => (
                  <option
                    key={option.value}
                    value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormControl>
            </FormGroup>
            <FormGroup
              className='form-inline'
              controlId='formControlsSelectMultiple'>
              <ControlLabel>Agency</ControlLabel>
              {'  '}
              <FormControl
                componentClass='select'
                value={visibilityFilter.feedId}
                onChange={this._onAgencyFilterChange}>
                <option value='ALL'>All</option>
                {feeds.map(fs => (
                  <option key={fs.id} value={getFeedId(fs)}>{fs.name}</option>
                ))}
              </FormControl>
            </FormGroup>
          </Col>
        </Row>
        {/* List of alerts */}
        <Row>
          <Col xs={12}>
            {isFetching || !fetched
              ? <Loading />
              : alerts.length
                ? alerts.map(alert => (
                  <AlertPreview
                    alert={alert}
                    key={alert.id}
                    editableFeeds={editableFeeds}
                    publishableFeeds={publishableFeeds}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick} />
                ))
                : <p className='lead text-center'>
                  No alerts found.
                  {hasFilter
                    ? <Button
                      bsStyle='link'
                      onClick={this._clearFilters}>Clear filters</Button>
                    : null
                  }
                </p>
            }
          </Col>
        </Row>
      </div>
    )
  }
}
