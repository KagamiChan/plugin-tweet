import { observer } from 'redux-observers'
import { isEqual, sortBy, last } from 'lodash'
import moment from 'moment-timezone'

import { extensionSelectorFactory } from 'views/utils/selectors'

import { PLUGIN_KEY, HISTORY_PATH } from './constants'
import FileWriter from './file-writer'
import { safeScreen } from './utils'

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

export const tweetObserver = observer(
  extensionSelectorFactory(PLUGIN_KEY),
  (dispatch, current = {}, previous = {}) => {
    // avoid initial state overwrites file
    console.log('observing')
    if (!isEqual(current, previous) && Object.keys(current).length > 0) {
      fileWriter.write(HISTORY_PATH, current)
    }

    if (Object.keys(current).length > 0) {
      const sortedPrevious = sortBy(previous, tweet => moment.tz(tweet.date, 'Asia/Shanghai').unix())
      const prevLatest = last(sortedPrevious) || {}
      const sortedCurrent = sortBy(current, tweet => moment.tz(tweet.date, 'Asia/Shanghai').unix())
      const currentLatest = last(sortedCurrent)
      // if sortedPrevious is empty, prevLatest will be an empty object
      // then the prevLatest.date will be undefined, which is expected
      // to prevent first load notification
      // console.log(currentLatest, currentLatest.date, prevLatest, prevLatest.date)
      if (currentLatest.date > (prevLatest.date || 0)) {
        let lastTweet = sortedCurrent.pop()
        while (!(lastTweet.id in previous) && sortedCurrent.length > 0) {
          window.toast(safeScreen(lastTweet.zh || lastTweet.jp).__html)
          lastTweet = sortedCurrent.pop()
        }
      }
    }
  },
)
