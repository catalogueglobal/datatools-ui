// @flow

import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {SECURE_API_PREFIX} from '../../common/constants'
import type {Feed, FeedVersion, Note} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

const requestingNotes = createVoidPayloadAction('REQUESTING_NOTES')
const receiveNotesForFeedSource = createAction(
  'RECEIVE_NOTES_FOR_FEEDSOURCE',
  (payload: {
    feedSource: Feed,
    notes: Array<Note>
  }) => payload
)
const receiveNotesForFeedVersion = createAction(
  'RECEIVE_NOTES_FOR_FEEDVERSION',
  (payload: {
    feedVersion: FeedVersion,
    notes: Array<Note>
  }) => payload
)

export type NoteActions = ActionType<typeof requestingNotes> |
  ActionType<typeof receiveNotesForFeedSource> |
  ActionType<typeof receiveNotesForFeedVersion>

export function fetchNotesForFeedSource (feedSource: Feed) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingNotes())
    const url = `${SECURE_API_PREFIX}note?type=FEED_SOURCE&objectId=${feedSource.id}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(notes => dispatch(receiveNotesForFeedSource({feedSource, notes})))
  }
}

export function postNoteForFeedSource (feedSource: Feed, note: Note) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `${SECURE_API_PREFIX}note?type=FEED_SOURCE&objectId=${feedSource.id}`
    return dispatch(secureFetch(url, 'post', note))
      .then(response => response.json())
      .then(note => dispatch(fetchNotesForFeedSource(feedSource)))
  }
}

export function fetchNotesForFeedVersion (feedVersion: FeedVersion) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingNotes())
    const url = `${SECURE_API_PREFIX}note?type=FEED_VERSION&objectId=${feedVersion.id}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(notes => dispatch(receiveNotesForFeedVersion({feedVersion, notes})))
  }
}

export function postNoteForFeedVersion (feedVersion: FeedVersion, note: Note) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `${SECURE_API_PREFIX}note?type=FEED_VERSION&objectId=${feedVersion.id}`
    return dispatch(secureFetch(url, 'post', note))
      .then(response => response.json())
      .then(note => dispatch(fetchNotesForFeedVersion(feedVersion)))
  }
}
