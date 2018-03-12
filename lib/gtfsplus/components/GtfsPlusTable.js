import React, {Component, PropTypes} from 'react'
import { Row, Col, FormControl, Table, Button, Glyphicon, Tooltip, OverlayTrigger } from 'react-bootstrap'

import OptionButton from '../../common/components/OptionButton'
import GtfsPlusField from './GtfsPlusField'
import GtfsPlusFieldHeader from './GtfsPlusFieldHeader'

export default class GtfsPlusTable extends Component {
  static propTypes = {
    newRowClicked: PropTypes.func,
    currentPage: PropTypes.number,
    deleteRowClicked: PropTypes.func,
    fieldEdited: PropTypes.func,
    gtfsEntitySelected: PropTypes.func,
    getGtfsEntity: PropTypes.func,
    newRowsDisplayed: PropTypes.func,
    pageCount: PropTypes.number,
    recordsPerPage: PropTypes.number,
    rows: PropTypes.array,
    setVisibilityFilter: PropTypes.func,
    showHelpClicked: PropTypes.func,
    table: PropTypes.object,
    validation: PropTypes.array,
    visibility: PropTypes.string
  }

  componentDidMount () {
    this.props.newRowsDisplayed(this.props.rows)
  }

  componentDidUpdate () {
    this.props.newRowsDisplayed(this.props.rows)
  }

  _onChangeVisibleRows = (evt) => this.props.setVisibilityFilter({visibility: evt.target.value})

  _onClickNewRow = () => this.props.newRowClicked({tableId: this.props.table.id})

  _onClickShowTableHelp = () => this.props.showHelpClicked(this.props.table.id)

  _onGoToFocus = e => e.target.select()

  _onGoToKeyUp = e => {
    // on press [ENTER], set page to new page number
    if (e.keyCode === 13) {
      const newPage = parseInt(e.target.value)
      if (newPage > 0 && newPage <= this.props.pageCount) {
        e.target.value = ''
        this.props.setCurrentPage({newPage})
      }
    }
  }

  _onPageLeft = evt => this.props.setCurrentPage({ newPage: this.props.currentPage - 1 })

  _onPageRight = evt => this.props.setCurrentPage({ newPage: this.props.currentPage + 1 })

  render () {
    const {currentPage, pageCount, visibility, showHelpClicked, table, rows} = this.props
    const headerStyle = {
      fontWeight: 'bold',
      fontSize: '24px',
      borderBottom: '2px solid black',
      marginBottom: '16px'
    }
    const subHeaderStyle = {
      marginBottom: '24px',
      textAlign: 'right'
    }
    return (<div>
      <Row>
        <Col xs={12}>
          <div style={headerStyle}>
            {table.name}
            <Glyphicon
              glyph='question-sign'
              style={{ cursor: 'pointer', fontSize: '18px', marginLeft: '10px' }}
              onClick={this._onClickShowTableHelp} />
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={8}>
          <div className='form-inline'>
            {(pageCount > 1)
              ? <span style={{ marginRight: '15px' }}>
                <Button
                  disabled={currentPage <= 1}
                  onClick={this._onPageLeft}>
                  <Glyphicon glyph='arrow-left' />
                </Button>
                <span style={{fontSize: '18px', margin: '0px 10px'}}>
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  disabled={currentPage >= pageCount}
                  onClick={this._onPageRight}>
                  <Glyphicon glyph='arrow-right' />
                </Button>
                <span style={{fontSize: '18px', marginLeft: '15px'}}>
                  Go to <FormControl
                    type='text'
                    size={5}
                    style={{ width: '50px', display: 'inline', textAlign: 'center' }}
                    onKeyUp={this._onGoToKeyUp}
                    onFocus={this._onGoToFocus} />
                </span>
              </span>
              : null
            }
            <span style={{ fontSize: '18px' }}>
              Show{' '}
              <FormControl
                componentClass='select'
                value={visibility}
                onChange={this._onChangeVisibleRows}>
                <option value='all'>All Records</option>
                <option value='validation'>Validation Issues Only</option>
              </FormControl>
            </span>
          </div>
        </Col>

        <Col xs={4} style={subHeaderStyle}>
          <i>Click (?) icon for details on field.<br />Required fields denoted by (*)</i>
        </Col>
      </Row>

      <Table>
        <thead>
          <tr>
            {table.fields.map((field, index) => (
              <GtfsPlusFieldHeader
                {...this.props}
                key={index}
                field={field}
                showHelpClicked={showHelpClicked}
                table={table} />
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows && rows.length > 0
            ? rows
            .map((data, rowIndex) => (
              <GtfsPlusRow
                {...this.props}
                data={data}
                key={`${table.id}-${rowIndex}`}
                index={rowIndex} />
            ))
            : null
          }
        </tbody>
      </Table>

      {(!rows || rows.length === 0)
        ? <Row><Col xs={12}>
          <i>No {visibility === 'validation' ? 'validation issues' : 'entries exist'} for this table.</i>
        </Col></Row>
        : null
      }

      <Row>
        <Button
          bsStyle='primary'
          bsSize='large'
          className='pull-right'
          onClick={this._onClickNewRow}
        ><Glyphicon glyph='plus' /> New Row</Button>
      </Row>

    </div>)
  }
}

class GtfsPlusRow extends Component {
  static propTypes = {
    currentPage: PropTypes.number,
    data: PropTypes.object,
    deleteRowClicked: PropTypes.func,
    index: PropTypes.number,
    recordsPerPage: PropTypes.number,
    table: PropTypes.object,
    validation: PropTypes.array,
    visibility: PropTypes.string
  }

  _onClickDeleteRow = (index) => {
    this.props.deleteRowClicked(this.props.table.id, index)
  }

  render () {
    const {data, table, validation} = this.props
    // // if validation filter is on, do not render issue-free records
    // if (visibility === 'validation' && validation.length < 5000 && !validation.find(v => v.rowIndex === data.origRowIndex)) {
    //   return null
    // }
    // // filter out rows that are not on current page
    // if (index > currentPage * recordsPerPage || index < (currentPage - 1) * recordsPerPage) {
    //   return null
    // }
    return (
      <tr>
        {table.fields.map(field => {
          const validationIssue = validation
            ? validation.find(v =>
                (v.rowIndex === data.origRowIndex && v.fieldName === field.name))
            : null

          const tooltip = validationIssue ? (
            <Tooltip id='validation-tooltip'>{validationIssue.description}</Tooltip>
          ) : null
          return (
            <td key={field.name}>
              {validationIssue
                ? <div style={{ float: 'left' }}>
                  <OverlayTrigger placement='top' overlay={tooltip}>
                    <Glyphicon glyph='alert' style={{ color: 'red', marginTop: '4px' }} />
                  </OverlayTrigger>
                </div>
                : null
              }
              <div style={{ marginLeft: (validationIssue ? '20px' : '0px') }}>
                {<GtfsPlusField
                  {...this.props}
                  row={data.rowIndex}
                  field={field}
                  currentValue={data[field.name]} />}
              </div>
            </td>
          )
        })}
        <td>
          <OptionButton
            bsStyle='danger'
            bsSize='small'
            value={data.rowIndex}
            className='pull-right'
            onClick={this._onClickDeleteRow}>
            <Glyphicon glyph='remove' />
          </OptionButton>
        </td>
      </tr>
    )
  }
}
