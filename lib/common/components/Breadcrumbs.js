import React from 'react'
import { Link, browserHistory } from 'react-router-dom'
import { SplitButton, MenuItem } from 'react-bootstrap'
import { connect } from 'react-redux'

import { fetchProjectFeeds } from '../../manager/actions/feeds'
import { getComponentMessages, getMessage } from '../util/config'

class Breadcrumbs extends React.Component {
  render () {
    let { dispatch, feedSource, feedVersion } = this.props
    if (!feedSource && feedVersion) {
      feedSource = feedVersion.feedSource
    }
    const messages = getComponentMessages('Breadcrumbs')
    const feedSourceDropdown = feedSource
      ? (
        <SplitButton
          bsStyle='link'
          style={{paddingTop: '5px', paddingBottom: '0px', paddingRight: '0px', paddingLeft: '0px'}}
          title={feedVersion ? <Link to={`/feed/${feedSource.id}`}>{feedSource.name}</Link> : feedSource.name}
          onSelect={eventKey => {
            browserHistory.push(`/feed/${eventKey}`)
          }}
          onToggle={(isOpen) => {
            if (isOpen && this.props.project.feedSources.length === 1) {
              dispatch(fetchProjectFeeds(this.props.project.id))
            }
          }}
        >
          {this.props.project.feedSources.length !== 1
            ? this.props.project.feedSources.map(fs => {
              if (fs.id === feedSource.id) return null
              return (
                <MenuItem key={fs.id} eventKey={fs.id}>{fs.name}</MenuItem>
              )
            })
            : <MenuItem disabled key={0}>Loading...</MenuItem>
          }
        </SplitButton>
      )
      : null
    return (
      <ol
        style={{}}
          // backgroundColor: 'rgba(0,0,0,0)'}
        className='breadcrumb' // col-sm-6'
      >
        <li><Link to='/'>{getMessage(messages, 'root')}</Link></li>
        {this.props.project
          ? <li><Link to='/project'>{getMessage(messages, 'projects')}</Link></li>
          : null
        }
        {/* active project OR link to project */}
        {this.props.project && !this.props.deployment && !this.props.feedSource
          ? <li className='active'>{this.props.project.name}</li>
          : this.props.project
          ? <li><Link to={`/project/${this.props.project.id}`}>{this.props.project.name}</Link></li>
          : null
        }
        {this.props.feedSource && !this.props.feedVersion
          ? <li className='active'>{feedSourceDropdown}</li>
          : null
        }
        {this.props.deployment
          ? <li><Link to={`/project/${this.props.deployment.project.id}/deployments`}>{getMessage(messages, 'deployments')}</Link></li>
          : null
        }
        {this.props.deployment
          ? <li className='active'>{this.props.deployment.name}</li>
          : null
        }
        {/* link to feed source */}
        {this.props.feedVersion
          ? <li>{feedSourceDropdown}</li>
          : null
        }
        {this.props.feedVersion
          ? <li className='active'>Version {this.props.feedVersion.version} Validation Explorer</li>
          : null
        }
      </ol>
    )
  }
}

export default connect()(Breadcrumbs)
