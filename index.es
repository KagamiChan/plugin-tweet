import React, { Component } from 'react'
import { keyBy, sortBy } from 'lodash'
import { connect } from 'react-redux'
import moment from 'moment-timezone'
import path from 'path'

import { extensionSelectorFactory } from 'views/utils/selectors'

import { onAddTweet, reducer as _reducer } from './redux'
import { PLUGIN_KEY } from './constants'
import TweetView from './views/tweet-view'

const { dispatch } = window

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
      <div id="plugin-tweet">
        <link href={path.join(__dirname, 'assets', 'style.css')} rel="stylesheet" />
        {
          sortBy(Object.keys(tweets)).reverse().map(id =>
            <TweetView key={id} tweet={tweets[id]} />
          )
        }
      </div>
    )
  }
})

export const reactClass = Tweet

export const reducer = _reducer
