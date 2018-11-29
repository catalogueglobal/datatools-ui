// @flow

import React, {Component} from 'react'

import { GTFS_ICONS } from '../util/ui'
import ActiveSidebarNavItem from '../../common/containers/ActiveSidebarNavItem'
import ActiveSidebar from '../../common/containers/ActiveSidebar'
import type {Entity, Feed} from '../../types'
import type {GtfsIcon} from '../util/ui'

type Props = {
  activeComponent: string,
  editingIsDisabled: boolean,
  feedSource: Feed,
  setActiveEntity: (string, string, Entity, ?string) => void
}

export default class EditorSidebar extends Component<Props> {
  isActive (item: GtfsIcon, component: string) {
    return component === item.id || (component === 'scheduleexception' && item.id === 'calendar')
  }

  render () {
    const {activeComponent, editingIsDisabled, feedSource} = this.props

    return (
      <ActiveSidebar>
        <ActiveSidebarNavItem
          data-test-id='nav-home-button'
          icon='home'
          label='Back to Feed'
          link={feedSource ? `/feed/${feedSource.id}` : `/home`}
          ref='backNav'
        />
        {GTFS_ICONS.map(item => {
          return item.hideSidebar
            ? null
            : <ActiveSidebarNavItem
              active={this.isActive(item, activeComponent)}
              data-test-id={`editor-${item.id}-nav-button`}
              disabled={editingIsDisabled}
              icon={item.icon}
              key={item.id}
              label={item.label}
              link={!feedSource
                ? '/home'
                : activeComponent === item.id
                  ? `/feed/${feedSource.id}/edit/`
                  : `/feed/${feedSource.id}/edit/${item.id}`} />
        })}
      </ActiveSidebar>
    )
  }
}
