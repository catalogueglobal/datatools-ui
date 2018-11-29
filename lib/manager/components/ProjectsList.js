// @flow

import React, {Component} from 'react'
import {
  Grid,
  Row,
  Col,
  Button,
  Table,
  FormControl,
  Panel,
  OverlayTrigger,
  Popover,
  Glyphicon
} from 'react-bootstrap'

import ManagerPage from '../../common/components/ManagerPage'
import EditableTextField from '../../common/components/EditableTextField'
import {getComponentMessages} from '../../common/util/config'
import {defaultSorter} from '../../common/util/util'
import type {Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  onComponentMount: Props => void,
  onNewProjectClick: any => void,
  projectNameChanged: (Project, string) => void,
  projects: Array<Project>,
  saveProject: Project => void,
  searchTextChanged: string => void,
  user: ManagerUserState,
  visibilitySearchText: any
}

const userCanCreateProject = (user: ManagerUserState) => {
  const {permissions} = user
  if (!permissions) return false
  else return permissions.isApplicationAdmin() || permissions.canAdministerAnOrganization()
}

export default class ProjectsList extends Component<Props> {
  messages = getComponentMessages('ProjectsList')

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  _newProjectClicked = () => {
    const {onNewProjectClick, user} = this.props
    const project = {}
    if (user.permissions && user.permissions.getOrganizationId()) {
      project.organizationId = user.permissions.getOrganizationId()
    }
    onNewProjectClick(project)
  }

  _onChangeSearch = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.searchTextChanged(evt.target.value)

  render () {
    const {
      projects,
      projectNameChanged,
      saveProject,
      user,
      visibilitySearchText
    } = this.props
    if (!projects) {
      return <ManagerPage />
    }
    const projectCreationDisabled = !userCanCreateProject(user)
    const visibleProjects = projects
      .filter((project) => {
        if (project.isCreating) return true // projects actively being created are always visible
        return project.name.toLowerCase().indexOf((visibilitySearchText || '').toLowerCase()) !== -1
      })
      .sort(defaultSorter)

    return (
      <ManagerPage
        ref='page'
        title={this.messages('title')}>
        <Grid fluid>
          <Panel header={(<h3>Projects</h3>)}>
            <Row>
              <Col xs={4}>
                <FormControl
                  placeholder={this.messages('search')}
                  onChange={this._onChangeSearch} />
              </Col>
              <Col xs={8}>
                <Button
                  bsStyle='primary'
                  data-test-id='create-new-project-button'
                  disabled={projectCreationDisabled}
                  className='pull-right'
                  onClick={this._newProjectClicked}>
                  {this.messages('new')}
                </Button>
                <OverlayTrigger
                  trigger='click'
                  placement='left'
                  overlay={
                    <Popover
                      id='project-help'
                      title={this.messages('help.title')}>
                      {this.messages('help.content')}
                    </Popover>
                  }>
                  <Button
                    bsStyle='link'
                    className='pull-right'>
                    <Glyphicon glyph='question-sign' />
                  </Button>
                </OverlayTrigger>
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <Table data-test-id='project-list-table' striped hover>
                  <thead>
                    <tr>
                      <th className='col-md-4'>
                        {this.messages('table.name')}
                      </th>
                      <th className='col-md-8' />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProjects.length > 0
                      ? visibleProjects.map((project) => (
                        <ProjectRow
                          key={project.id || 'new-project'}
                          project={project}
                          projectNameChanged={projectNameChanged}
                          saveProject={saveProject}
                          user={user} />
                      ))
                      : <tr>
                        <td className='col-md-12 text-center'>
                          {this.messages('noProjects')}
                          {'    '}
                          <Button
                            bsStyle='primary'
                            disabled={projectCreationDisabled}
                            onClick={this._newProjectClicked}>
                            {this.messages('createFirst')}
                          </Button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Panel>
        </Grid>
      </ManagerPage>
    )
  }
}

class ProjectRow extends Component<{
  project: Project,
  projectNameChanged: (Project, string) => void,
  saveProject: any => void,
  user: ManagerUserState
}> {
  _onChangeName = (name: string) => {
    const {project, projectNameChanged, saveProject} = this.props
    const proj = {}
    proj.name = name
    if (project.organizationId) proj.organizationId = project.organizationId
    if (project.isCreating) saveProject(proj)
    else projectNameChanged(project, name)
  }

  render () {
    const {project, user} = this.props
    const disabled = !user.permissions ||
      !user.permissions.isProjectAdmin(project.id, project.organizationId)
    return (
      <tr>
        <td className='col-md-4'>
          <div className='project-name-editable'>
            <EditableTextField
              isEditing={(project.isCreating === true)}
              value={project.name}
              disabled={disabled}
              onChange={this._onChangeName}
              link={`/project/${project.id}`} />
          </div>
        </td>
        <td className='col-md-8' />
      </tr>
    )
  }
}
