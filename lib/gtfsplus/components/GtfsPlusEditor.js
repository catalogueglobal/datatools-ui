import React, {Component, PropTypes} from 'react'
import {Grid, Row, Col, Button, Glyphicon, PageHeader} from 'react-bootstrap'
import JSZip from 'jszip'
import { Link } from 'react-router'

import ManagerPage from '../../common/components/ManagerPage'
import OptionButton from '../../common/components/OptionButton'
import GtfsPlusTable from './GtfsPlusTable'
import { getGtfsPlusSpec } from '../../common/util/config'

export default class GtfsPlusEditor extends Component {
  static propTypes = {
    deleteRowClicked: PropTypes.func,
    feedSource: PropTypes.object,
    feedVersionId: PropTypes.string,
    fieldEdited: PropTypes.func,
    gtfsEntityLookup: PropTypes.object,
    gtfsEntitySelected: PropTypes.func,
    loadGtfsEntities: PropTypes.func,
    newRowClicked: PropTypes.func,
    onComponentMount: PropTypes.func,
    project: PropTypes.object,
    setActiveTable: PropTypes.func,
    setCurrentPage: PropTypes.func,
    setVisibilityFilter: PropTypes.func,
    tableData: PropTypes.object,
    user: PropTypes.object,
    validation: PropTypes.object
  }

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  save = () => {
    const zip = new JSZip()

    for (const table of getGtfsPlusSpec()) {
      if (!(table.id in this.props.tableData) || this.props.tableData[table.id].length === 0) continue

      let fileContent = ''
      // white the header line
      const fieldNameArr = table.fields.map(field => field['name'])
      fileContent += fieldNameArr.join(',') + '\n'

      // write the data rows
      this.props.tableData[table.id].map(rowData => {
        const rowText = fieldNameArr.map(fieldName => {
          return rowData[fieldName] || ''
        }).join(',')
        fileContent += rowText + '\n'
      })

      // add to the zip archive
      zip.file(table.name, fileContent)
    }

    zip.generateAsync({type: 'blob'}).then((content) => {
      this.props.feedSaved(content)
    })
  }

  _getGtfsEntity = (type, id) => this.props.gtfsEntityLookup[`${type}_${id}`]

  _gtfsEntitySelected = (type, entity) => this.props.gtfsEntitySelected(type, entity)

  _newRowsDisplayed = (rows) => {
    const {activeTableId, feedSource, feedVersionId, loadGtfsEntities} = this.props
    loadGtfsEntities(activeTableId, rows, feedSource, feedVersionId)
  }

  _selectTable = (activeTableId) => this.props.setActiveTable({activeTableId})

  _showHelpClicked = (tableId, fieldName) => {
    const helpContent = fieldName
      ? getGtfsPlusSpec()
          .find(t => t.id === tableId).fields
            .find(f => f.name === fieldName).helpContent
      : getGtfsPlusSpec()
          .find(t => t.id === tableId).helpContent
    this.refs.page.showInfoModal({
      title: `Help for ${tableId}.txt` + (fieldName ? `: ${fieldName}` : ''),
      body: helpContent || '(No help content found for this field)'
    })
  }

  render () {
    const {
      activeTableId,
      feedSource,
      project,
      tableData,
      user,
      validation,
      visibleRows
    } = this.props
    if (!feedSource) return null
    const GTFS_PLUS_SPEC = getGtfsPlusSpec()
    const editingIsDisabled = !user.permissions.hasFeedPermission(feedSource.organizationId, feedSource.projectId, feedSource.id, 'edit-gtfs')
    const activeTable = GTFS_PLUS_SPEC.find(t => t.id === activeTableId)

    return (
      <ManagerPage ref='page'>
        <Grid>
          <Row>
            <Col xs={12}>
              <ul className='breadcrumb'>
                <li><Link to='/'>Explore</Link></li>
                <li><Link to='/project'>Projects</Link></li>
                <li><Link to={`/project/${project.id}`}>{project.name}</Link></li>
                <li><Link to={`/feed/${feedSource.id}`}>{feedSource.name}</Link></li>
                <li className='active'>Edit GTFS+</li>
              </ul>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <PageHeader>Editing GTFS+ for {feedSource.name}
                <Button
                  bsStyle='primary'
                  bsSize='large'
                  disabled={editingIsDisabled}
                  className='pull-right'
                  onClick={this.save}>
                  <Glyphicon glyph='save' /> Save & Revalidate
                </Button>
              </PageHeader>
            </Col>
          </Row>

          <Row>
            <Col xs={2}>
              {GTFS_PLUS_SPEC.map((table, index) => {
                const tableLength = tableData[table.id] && tableData[table.id].length
                return (<p key={index}>
                  <OptionButton
                    active={table.id === activeTableId}
                    key={table.id}
                    className={'gtfsplus-table-button'}
                    style={{color: tableLength ? 'black' : 'grey'}}
                    title={table.id}
                    value={table.id}
                    onClick={this._selectTable}>
                    {validation && (table.id in validation)
                      ? <Glyphicon glyph='alert' style={{ color: 'red', marginRight: '8px' }} />
                      : null
                    }
                    {table.id}
                  </OptionButton>
                </p>)
              })}
            </Col>
            <Col xs={10}>
              <GtfsPlusTable
                {...this.props}
                ref='activeTable'
                table={activeTable}
                rows={visibleRows}
                validation={validation[activeTable.id] || []}
                gtfsEntitySelected={this._gtfsEntitySelected}
                getGtfsEntity={this._getGtfsEntity}
                showHelpClicked={this._showHelpClicked}
                newRowsDisplayed={this._newRowsDisplayed} />
            </Col>
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}
