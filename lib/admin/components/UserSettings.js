// @flow

import React, {Component, type Node} from 'react'
import {Row, Col, Checkbox, Panel, SplitButton, MenuItem, Label} from 'react-bootstrap'
import update from 'react-addons-update'
import Select from 'react-select'

import UserPermissions from '../../common/user/UserPermissions'
import {getComponentMessages} from '../../common/util/config'
import type {Permission} from '../../common/user/UserPermissions'
import type {Organization, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import ProjectSettings from './ProjectSettings'

type Props = {
  creatingUser: ManagerUserState,
  fetchProjectFeeds: string => void,
  isCreating?: boolean,
  organizations: Array<Organization>,
  permissions: UserPermissions,
  projects: Array<Project>
}

type State = {
  appAdminChecked: boolean,
  currentProjectIndex: number,
  orgAdminChecked?: boolean,
  organization: ?Organization,
  projectSettings: {
    [string]: {
      access: string,
      defaultFeeds: Array<string>,
      permissions: Array<string>
    }
  }
}

type OrganizationOption = {
  label: string,
  organization: Organization,
  value: string
}

const orgToOption = (organization: Organization) => {
  return {label: organization.name, value: organization.id, organization}
}

export default class UserSettings extends Component<Props, State> {
  messages = getComponentMessages('UserSettings')

  constructor (props: Props) {
    super(props)
    const {isCreating, organizations, permissions, projects, creatingUser} = this.props
    this.state = {
      appAdminChecked: permissions.isApplicationAdmin(),
      currentProjectIndex: 0,
      projectSettings: {},
      organization: null
    }

    organizations.forEach((organization: Organization, i: number) => {
      if (permissions.hasOrganization(organization.id)) {
        this.state.organization = organization
        if (permissions.isOrganizationAdmin(organization.id)) {
          this.state.orgAdminChecked = true
        }
      } else if (
        isCreating &&
        creatingUser.permissions &&
        creatingUser.permissions.getOrganizationId() === organization.id
      ) {
        this.state.organization = organization
      }
    })
    projects.forEach((project: Project, i: number) => {
      let access: string = 'none'
      let defaultFeeds: Array<string> = []
      let newPermissions: Array<string> = []
      if (permissions.hasProject(project.id, project.organizationId)) {
        if (permissions.isProjectAdmin(project.id, project.organizationId)) {
          access = 'admin'
        } else {
          access = 'custom'
          const projectPermissions: Array<Permission> = permissions.getProjectPermissions(project.id)
          newPermissions = projectPermissions.map((p: Permission) => p.type)
          defaultFeeds = permissions.getProjectDefaultFeeds(project.id)
        }
      }
      this.state.projectSettings[project.id] = { access, defaultFeeds, permissions: newPermissions }
    })
  }

  getSettings () {
    if (this.state.appAdminChecked) {
      return {
        permissions: [{
          type: 'administer-application'
        }],
        projects: [],
        client_id: process.env.AUTH0_CLIENT_ID
      }
    }

    const settings = {
      permissions: [],
      projects: [],
      organizations: [],
      client_id: process.env.AUTH0_CLIENT_ID
    }
    if (this.state.organization) {
      const orgSettings = {
        organization_id: this.state.organization.id,
        permissions: this.state.orgAdminChecked
          ? [{type: 'administer-organization'}] // this.state.orgPermissions[this.state.organization.id]
          : []
      }
      settings.organizations.push(orgSettings)
    }
    this.props.projects.forEach((project: Project, i: number) => {
      const stateProjectSettings = this.state.projectSettings[project.id]
      if (stateProjectSettings.access === 'none') return

      const projectSettings = {}
      projectSettings.project_id = project.id
      projectSettings.permissions = []
      if (stateProjectSettings.access === 'admin') {
        projectSettings.permissions.push({
          type: 'administer-project'
        })
      } else if (stateProjectSettings.access === 'custom') {
        projectSettings.defaultFeeds = stateProjectSettings.defaultFeeds
        // users have view-all permissions by default
        projectSettings.permissions.push({
          type: 'view-feed',
          feeds: ['*']
        })
        projectSettings.permissions = projectSettings.permissions
          .concat(stateProjectSettings.permissions.map((permission) => ({type: permission})))
      }
      settings.projects.push(projectSettings)
    })

    return settings
  }

  _onProjectSelected = (key: number) => this.setState({currentProjectIndex: key})

  getProjectLabel = (access: string): Node => {
    switch (access) {
      case 'none': return <Label>{this.messages('project.noAccess')}</Label>
      case 'admin': return <Label bsStyle='primary'>{this.messages('project.admin')}</Label>
      case 'custom': return <Label bsStyle='success'>{this.messages('project.custom')}</Label>
      default: return null
    }
  }

  appAdminClicked = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const appAdminChecked: boolean = evt.target.checked
    const stateUpdate = {}
    stateUpdate.appAdminChecked = appAdminChecked
    if (appAdminChecked) {
      stateUpdate.organization = null
      stateUpdate.orgAdminChecked = false
    }
    this.setState(stateUpdate)
  }

  _onOrgAdminClicked (evt: SyntheticInputEvent<HTMLInputElement>) {
    this.setState({orgAdminChecked: evt.target.checked})
  }

  _onOrgChanged = (val: OrganizationOption) => {
    const stateUpdate = {
      organization: (val && val.organization) || null,
      orgAdminChecked: false,
      projectSettings: {}
    }
    this.props.projects.forEach((p: Project) => {
      const access: string = 'none'
      const defaultFeeds = []
      const permissions = []
      stateUpdate.projectSettings[p.id] = {access, defaultFeeds, permissions}
    })
    this.setState(stateUpdate)
  }

  projectAccessUpdated = (projectId: string, newAccess: string) => {
    const stateUpdate = {projectSettings: {[projectId]: {$merge: {access: newAccess}}}}
    this.setState(update(this.state, stateUpdate))
  }

  projectFeedsUpdated = (projectId: string, newFeeds: Array<string>) => {
    const stateUpdate = {projectSettings: {[projectId]: {$merge: {defaultFeeds: newFeeds}}}}
    this.setState(update(this.state, stateUpdate))
  }

  projectPermissionsUpdated = (projectId: string, newPermissions: Array<string>) => {
    const stateUpdate = {projectSettings: {[projectId]: {$merge: {permissions: newPermissions}}}}
    this.setState(update(this.state, stateUpdate))
  }

  render () {
    const { creatingUser, fetchProjectFeeds, organizations, projects } = this.props
    const creatorIsApplicationAdmin = !!(creatingUser.permissions &&
      creatingUser.permissions.isApplicationAdmin())

    // limit available projects to those that either have no org or match the current state org
    const orgProjects = projects
      .filter(p => !p.organizationId || (this.state.organization && this.state.organization.id === p.organizationId))
    const currentProject: Project = orgProjects[this.state.currentProjectIndex]
    const projectPanel = (
      <Panel
        header={
          <h3>
            Project Settings for{' '}
            <SplitButton
              disabled={!currentProject}
              title={currentProject ? currentProject.name : 'No projects available'}
              id={currentProject ? currentProject.name : 'No projects available'}
              onSelect={this._onProjectSelected}>
              {orgProjects.map((project, i) => {
                const settings = this.state.projectSettings[project.id]
                if (settings) {
                  return <MenuItem
                    key={project.id}
                    eventKey={i}>
                    {project.name} {this.getProjectLabel(settings.access)}
                  </MenuItem>
                }
              })}
            </SplitButton>
          </h3>
        }
      >
        {orgProjects.map((project: Project, i: number) => {
          if (i !== this.state.currentProjectIndex) return null
          const settings = this.state.projectSettings[project.id]
          return <ProjectSettings
            project={project}
            key={project.id}
            settings={settings}
            fetchProjectFeeds={fetchProjectFeeds}
            visible={i === this.state.currentProjectIndex}
            projectAccessUpdated={this.projectAccessUpdated}
            projectFeedsUpdated={this.projectFeedsUpdated}
            projectPermissionsUpdated={this.projectPermissionsUpdated} />
        })}
      </Panel>
    )
    return (
      <Row>
        <Col xs={4}>
          <Panel header={<h3>Organization settings</h3>}>
            {creatorIsApplicationAdmin &&
              <Checkbox
                checked={this.state.appAdminChecked}
                onChange={this.appAdminClicked}
                ref='appAdminCheckbox'>
                {this.messages('admin.title')}
              </Checkbox>
            }
            {/* Organizations selector. Only show if there exist organizations already. */}
            {!this.state.appAdminChecked && organizations && organizations.length
              ? <div className='orgDetails'>
                <Select
                  options={organizations.map(orgToOption)}
                  placeholder='Choose organization...'
                  disabled={!creatorIsApplicationAdmin}
                  value={this.state.organization && orgToOption(this.state.organization)}
                  onChange={this._onOrgChanged} />
                {this.state.organization &&
                  <Checkbox
                    checked={this.state.orgAdminChecked}
                    onChange={this._onOrgAdminClicked}
                    ref='orgAdminCheckbox'>
                    {this.messages('org.admin')}
                  </Checkbox>
                }
              </div>
              : null
            }
          </Panel>
        </Col>
        <Col xs={8}>
          {this.state.appAdminChecked
            ? <i>{this.messages('admin.description')}</i>
            : this.state.orgAdminChecked
              ? <i>{this.messages('org.description')}</i>
              : projectPanel
          }
        </Col>
      </Row>
    )
  }
}
