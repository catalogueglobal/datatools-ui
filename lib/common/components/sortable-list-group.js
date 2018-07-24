import Icon from '@conveyal/woonerf/components/icon'
import React, {PropTypes, Component} from 'react'
import { Row, Col, Button, ButtonGroup, FormControl, FormGroup, Badge, ControlLabel, Panel, ListGroup } from 'react-bootstrap'

import OptionButton from './OptionButton'
import { getFeedId } from '../util/modules'
import toSentenceCase from '../util/to-sentence-case'

const MESSAGES = {
  new: 'New',
  search: 'Search',
  sort: 'Sort by',
  feedFilter: 'Agency'
}

export default class SortableListGroup extends Component {
  static propTypes = {
    children: PropTypes.array.isRequired,
    feeds: PropTypes.array,
    filterCounts: PropTypes.object,
    filter: PropTypes.string,
    filters: PropTypes.array,
    feedId: PropTypes.string,
    messages: PropTypes.object,
    onClickNew: PropTypes.func,
    onFeedFilterChange: PropTypes.func,
    onFilterChange: PropTypes.func,
    onSearchChange: PropTypes.func,
    onSortChange: PropTypes.func,
    searchText: PropTypes.string,
    sort: PropTypes.object,
    sortOptions: PropTypes.array
  }

  _onClickNew = () => {
    this.props.onClickNew && this.props.onClickNew()
  }

  _onSortChange = evt => {
    const values = evt.target.value.split(':')
    const sort = {
      type: values[0],
      direction: values[1]
    }
    this.props.onSortChange(sort)
  }

  render () {
    const {
      children,
      feeds,
      filterCounts,
      filter,
      filters,
      feedId,
      onFeedFilterChange,
      onFilterChange,
      onSearchChange,
      searchText,
      sort,
      sortOptions
    } = this.props
    // Merge any messages provided through props with default values
    const messages = Object.assign({}, this.props.messages || {}, MESSAGES)
    console.log(messages, this.props.messages)
    return (
      <div>
        <Row>
          {/* Search/text filter */}
          <FormGroup className='col-xs-9'>
            <FormControl
              type='text'
              placeholder={messages.search}
              onChange={onSearchChange}
              defaultValue={searchText} />
          </FormGroup>
          {/* New item button */}
          <FormGroup className='col-xs-3'>
            <Button
              bsStyle='primary'
              onClick={this._onClickNew}
              block>
              <Icon type='plus' /> {messages.new}
            </Button>
          </FormGroup>
          <Col xs={12}>
            <FormGroup>
              <ButtonGroup justified>
                {filters.map(f => (
                  <OptionButton
                    active={filter === f}
                    onClick={onFilterChange}
                    value={f}
                    key={f}>
                    {toSentenceCase(f)}{' '}
                    {filterCounts
                      ? <Badge style={{backgroundColor: '#babec0'}}>{filterCounts[f]}</Badge>
                      : null
                    }
                  </OptionButton>
                ))}
              </ButtonGroup>
            </FormGroup>
          </Col>
        </Row>
        <Panel
          // List item filters
          header={
            <Row>
              <Col xs={12}>
                {sortOptions
                  ? <FormGroup style={{marginBottom: 0}} className='form-inline pull-right'>
                    <ControlLabel>{messages.sort}</ControlLabel>
                    {'  '}
                    <FormControl
                      componentClass='select'
                      value={sort && `${sort.type}:${sort.direction}`}
                      onChange={this._onSortChange}>
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </FormControl>
                  </FormGroup>
                  : null
                }
                {onFeedFilterChange
                  ? <FormGroup style={{marginBottom: 0}} className='form-inline'>
                    <ControlLabel>{messages.feed}</ControlLabel>
                    {'  '}
                    <FormControl
                      componentClass='select'
                      value={feedId}
                      onChange={onFeedFilterChange}>
                      <option value='ALL'>All</option>
                      {feeds.map(fs => (
                        <option key={fs.id} value={getFeedId(fs)}>{fs.name}</option>
                      ))}
                    </FormControl>
                  </FormGroup>
                : null
              }
              </Col>
            </Row>
          }
        >
          {/* List of children items */}
          <ListGroup fill>
            {children}
          </ListGroup>
        </Panel>
      </div>
    )
  }
}
