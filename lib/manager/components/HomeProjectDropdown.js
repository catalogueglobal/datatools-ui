// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Button, DropdownButton, MenuItem } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

import {getAbbreviatedProjectName} from '../../common/util/util'
import type {Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  activeProject: Project,
  user: ManagerUserState,
  visibleProjects: Array<Project>
}

export default class HomeProjectDropdown extends Component<Props> {
  render () {
    const {
      activeProject,
      user,
      visibleProjects
    } = this.props
    const isAdmin = user.permissions && user.permissions.isApplicationAdmin()
    const {profile} = user
    if (!profile) return null
    const abbreviatedProjectName = getAbbreviatedProjectName(activeProject)
    return (
      <div style={{marginBottom: '20px'}}>
        {activeProject
          ? <LinkContainer className='pull-right' to={`/project/${activeProject.id}`}>
            <Button bsStyle='primary'>View {abbreviatedProjectName}</Button>
          </LinkContainer>
          : null
        }
        <DropdownButton
          id='context-dropdown'
          title={activeProject
            ? <span>
              <Icon type='folder-open-o' /> {abbreviatedProjectName}
            </span>
            : <span>
              <img alt={profile.email} height={20} width={20} src={profile.picture} />
              {' '}
              {profile.nickname}
            </span>
          }
        >
          {activeProject && (
            <LinkContainer key='home-link' to={`/home/`}>
              <MenuItem>
                <span>
                  <img alt={profile.email} height={20} width={20} src={profile.picture} />
                  {' '}
                  {profile.nickname}
                </span>
              </MenuItem>
            </LinkContainer>
          )}
          {activeProject && <MenuItem key='divider' divider />}
          {visibleProjects.length > 0
            ? visibleProjects.map((project, index) => {
              if (activeProject && project.id === activeProject.id) {
                return null
              }
              return (
                <LinkContainer to={`/home/${project.id}`} key={project.id}>
                  <MenuItem eventKey={project.id}>
                    <Icon type='folder-o' /> {project.name}
                  </MenuItem>
                </LinkContainer>
              )
            })
            : null
          }
          {(activeProject && visibleProjects.length > 1) || !activeProject ? <MenuItem divider /> : null}
          {isAdmin && <LinkContainer to='/settings/organizations'><MenuItem><Icon type='users' /> Manage projects</MenuItem></LinkContainer>}
          {isAdmin && <MenuItem divider />}
          {isAdmin && <LinkContainer to='/project'><MenuItem><Icon type='plus' /> Create project</MenuItem></LinkContainer>}
        </DropdownButton>
      </div>
    )
  }
}
