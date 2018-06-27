// @flow

import languages from './languages'
import projects from './projects'
import status from './status'
import ui from './ui'
import user from './user'

import type {LanguagesState} from './languages'
import type {ProjectsState} from './projects'
import type {StatusState} from './status'
import type {UiState} from './ui'
import type {UserState} from './user'

export type ManagerStates = {
  languages: LanguagesState,
  projects: ProjectsState,
  status: StatusState,
  ui: UiState,
  user: UserState
}

export default {
  languages,
  projects,
  status,
  ui,
  user
}
