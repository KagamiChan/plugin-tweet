import React, { Component } from 'react'
import { keyBy, sortBy } from 'lodash'
import { connect } from 'react-redux'
import { Panel, ListGroup, ListGroupItem } from 'react-bootstrap'
import sanitizeHTML from 'sanitize-html'
import moment from 'moment-timezone'

import { extensionSelectorFactory } from 'views/utils/selectors'

import { onAddTweet, reducer as _reducer } from './redux'
import { PLUGIN_KEY } from './constants'

const { dispatch } = window
const LOCAL_TIMEZONE = moment.tz.guess()

const safeScreen = text => ({
  __html: sanitizeHTML(text, {
    allowedTags: ['br'],
  }),
})

const convertTimeZone = (timeStr, tz = LOCAL_TIMEZONE) => {
  console.log(timeStr)
  if (!moment(timeStr).isValid()) {
    console.warn(`time string cannot be parsed, ${timeStr}`)
    return timeStr
  }
  const timeShanghai = moment.tz(timeStr, 'Asia/Shanghai')
  return timeShanghai.clone().tz(tz).format('YYYY-MM-DD HH:mm:ss')
}

const Tweet = connect(
  state => ({
    tweets: extensionSelectorFactory(PLUGIN_KEY)(state) || {},
  })
)(
class Tweet extends Component {
  async componentDidMount() {
    const currentTime = moment()
    const tasks = [0, 1, 2].map((day) => {
      const date = currentTime.subtract(day, 'days').format('YYYYMMDD')
      return Tweet.fetchTweet(`http://api.kcwiki.moe/tweet/date/${date}`)
    })
    await Promise.all(tasks)
  }

  static async fetchTweet(url) {
    const resp = await fetch(url)
    const contentType = resp.headers.get('content-type')
    let json = []
    if (contentType && contentType.indexOf('json') !== -1) {
      json = await resp.json()
    } else {
      console.warn(`invalid response got from ${url}`)
    }

    if (json.length > 0) {
      dispatch(onAddTweet(keyBy(json, 'id')))
    }
  }

  render() {
    const { tweets } = this.props
    return (
      <div>
        {
          sortBy(Object.keys(tweets)).reverse().map(id =>
              <Panel key={id} header={convertTimeZone(tweets[id].date)} bsStyle="info">
                <ListGroup fill>
                  <ListGroupItem dangerouslySetInnerHTML={safeScreen(tweets[id].jp || '')} />
                  <ListGroupItem dangerouslySetInnerHTML={safeScreen(tweets[id].zh || '')} />
                </ListGroup>
              </Panel>
              )
        }
      </div>
    )
  }
})

export const reactClass = Tweet

export const reducer = _reducer
