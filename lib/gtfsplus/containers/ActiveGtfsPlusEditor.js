import { connect } from 'react-redux'

import GtfsPlusEditor from '../components/GtfsPlusEditor'
import { fetchFeedSourceAndProject } from '../../manager/actions/feeds'
import {
  addGtfsPlusRow,
  updateGtfsPlusField,
  deleteGtfsPlusRow,
  uploadGtfsPlusFeed,
  downloadGtfsPlusFeed,
  loadGtfsEntities,
  receiveGtfsEntities,
  setActiveTable,
  setCurrentPage,
  setVisibilityFilter
} from '../actions/gtfsplus'
import {getVisibleRows, getFilteredPageCount} from '../selectors'

const mapStateToProps = (state, ownProps) => {
  const {activeTableId, currentPage, gtfsEntityLookup, recordsPerPage, tableData, validation, visibility} = state.gtfsplus
  const feedSourceId = ownProps.routeParams.feedSourceId
  const feedVersionId = ownProps.routeParams.feedVersionId
  const user = state.user
  // find the containing project
  const project = state.projects.all
    ? state.projects.all.find(p => {
      if (!p.feedSources) return false
      return (p.feedSources.findIndex(fs => fs.id === feedSourceId) !== -1)
    })
    : null

  let feedSource
  if (project) {
    feedSource = project.feedSources.find(fs => fs.id === feedSourceId)
  }

  return {
    activeTableId,
    currentPage,
    feedSource,
    feedVersionId,
    gtfsEntityLookup,
    pageCount: getFilteredPageCount(state),
    project,
    recordsPerPage,
    tableData,
    user,
    validation,
    visibleRows: getVisibleRows(state),
    visibility
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const feedSourceId = ownProps.routeParams.feedSourceId
  const feedVersionId = ownProps.routeParams.feedVersionId

  return {
    onComponentMount: (initialProps) => {
      if (!initialProps.feedSource) dispatch(fetchFeedSourceAndProject(feedSourceId))
      if (!initialProps.tableData) dispatch(downloadGtfsPlusFeed(feedVersionId))
    },
    newRowClicked: (payload) => dispatch(addGtfsPlusRow(payload)),
    deleteRowClicked: (tableId, rowIndex) => dispatch(deleteGtfsPlusRow(tableId, rowIndex)),
    fieldEdited: (payload) => dispatch(updateGtfsPlusField(payload)),
    feedSaved: (file) => {
      dispatch(uploadGtfsPlusFeed(feedVersionId, file))
      .then(() => dispatch(downloadGtfsPlusFeed(feedVersionId)))
    },
    loadGtfsEntities: (tableId, rows, feedSource, feedVersionId) => {
      if (feedSource) dispatch(loadGtfsEntities(tableId, rows, feedSource, feedVersionId))
    },
    gtfsEntitySelected: (type, entity) => dispatch(receiveGtfsEntities([entity])),
    setCurrentPage: payload => dispatch(setCurrentPage(payload)),
    setActiveTable: payload => dispatch(setActiveTable(payload)),
    setVisibilityFilter: payload => dispatch(setVisibilityFilter(payload))
  }
}

const ActiveGtfsPlusEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsPlusEditor)

export default ActiveGtfsPlusEditor
