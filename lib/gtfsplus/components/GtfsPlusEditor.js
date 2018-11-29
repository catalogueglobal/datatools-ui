// @flow

import React, {Component} from 'react'
import {Grid, Row, Col, Button, Glyphicon, PageHeader} from 'react-bootstrap'
import JSZip from 'jszip'
import {Link} from 'react-router'

import ManagerPage from '../../common/components/ManagerPage'
import OptionButton from '../../common/components/OptionButton'
import {getGtfsPlusSpec} from '../../common/util/config'
import type {Feed, Project, Entity} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import GtfsPlusTable from './GtfsPlusTable'

type Props = {
  activeTableId: string,
  currentPage: number,
  deleteRowClicked: (string, number) => void,
  feedSaved: any,
  feedSource: Feed,
  feedVersionId: string,
  fieldEdited: any,
  gtfsEntityLookup: any,
  gtfsEntitySelected: (string, Entity) => void,
  loadGtfsEntities: (string, Array<any>, Feed, string) => void,
  newRowClicked: ({tableId: string}) => void,
  onComponentMount: Props => void,
  pageCount: number,
  project: Project,
  recordsPerPage: number,
  setActiveTable: any,
  setCurrentPage: any,
  setVisibilityFilter: any,
  tableData: any,
  user: ManagerUserState,
  validation: any,
  visibility: any,
  visibleRows: any
}

export default class GtfsPlusEditor extends Component<Props> {
  GTFS_PLUS_SPEC = getGtfsPlusSpec()

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  save = () => {
    const zip = new JSZip()

    for (const table of this.GTFS_PLUS_SPEC) {
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

  _getGtfsEntity = (type: string, id: string) => this.props.gtfsEntityLookup[`${type}_${id}`]

  _gtfsEntitySelected = (type: string, entity: Entity) =>
    this.props.gtfsEntitySelected(type, entity)

  _newRowsDisplayed = (rows: Array<any>) => {
    const {activeTableId, feedSource, feedVersionId, loadGtfsEntities} = this.props
    loadGtfsEntities(activeTableId, rows, feedSource, feedVersionId)
  }

  _selectTable = (activeTableId: string) => this.props.setActiveTable({activeTableId})

  _showHelpClicked = (tableId: string, fieldName: ?string) => {
    const activeTable = this.GTFS_PLUS_SPEC.find(t => t.id === tableId)
    if (!activeTable) {
      console.warn(`Could not locate GTFS+ table with id=${tableId}`)
      return
    }
    const field = activeTable.fields
      .find(f => f.name === fieldName)
    const helpContent = fieldName
      ? field && field.helpContent
      : activeTable.helpContent
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
    const editingIsDisabled = !user.permissions ||
      !user.permissions.hasFeedPermission(
        feedSource.organizationId,
        feedSource.projectId,
        feedSource.id,
        'edit-gtfs'
      )
    const activeTable = this.GTFS_PLUS_SPEC.find(t => t.id === activeTableId)
    if (!activeTable) {
      console.warn(`Could not locate GTFS+ table with id=${activeTableId}`)
      return null
    }

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
              {this.GTFS_PLUS_SPEC.map((table, index) => {
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
