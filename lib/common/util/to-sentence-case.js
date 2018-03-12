// @flow

import toLower from 'lodash.tolower'
import upperFirst from 'lodash.upperfirst'

export default function toSentenceCase (s: string): string {
  return upperFirst(toLower(s))
}
