import { connect } from 'react-redux'

import { fetchFeed } from '../../../../gtfs/actions/feed'
import Frequencies from '../components/Frequencies'

const mapStateToProps = (state, ownProps) => {
  return {
    feed: state.gtfs.feed
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const {namespace} = ownProps.version
  return {
    onComponentMount: (initialProps) => {
      if (!initialProps.feed.fetchStatus.fetched) {
        dispatch(fetchFeed(namespace))
      }
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Frequencies) 
