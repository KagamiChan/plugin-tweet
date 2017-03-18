import { observer } from 'redux-observers'
import { isEqual } from 'lodash'

import { extensionSelectorFactory } from 'views/utils/selectors'

import { PLUGIN_KEY, HISTORY_PATH } from './constants'
import FileWriter from './file-writer'

export const onAddTweet = (tweets = {}) =>
  ({
    type: '@@poi-plugin-tweet@addTweet',
    tweets,
  })

// reducer
export const reducer = (state = {}, action) => {
  const { type, tweets } = action
  switch (type) {
    case '@@poi-plugin-tweet@addTweet':
      return {
        ...state,
        ...tweets,
      }
    default:
      return state
  }
}

// observers
const fileWriter = new FileWriter()

export const prophetObserver = observer(
  extensionSelectorFactory(PLUGIN_KEY),
  (dispatch, current = {}, previous) => {
    // avoid initial state overwrites file
    if (!isEqual(current, previous) && Object.keys(current).length > 0) {
      fileWriter.write(HISTORY_PATH, current)
    }
  },
)
