import React, { Component } from 'react'
import { keyBy, sortBy, debounce } from 'lodash'
import { connect } from 'react-redux'
import moment from 'moment-timezone'
import path from 'path'
import { Button, Label } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'

import { extensionSelectorFactory } from 'views/utils/selectors'

import { onAddTweet, reducer as _reducer } from './redux'
import { PLUGIN_KEY } from './constants'
import TweetView from './views/tweet-view'
import { openURL } from './utils'
import Scheduler from './scheduler'

const { dispatch } = window

const Tweet = connect(
  state => ({
    tweets: extensionSelectorFactory(PLUGIN_KEY)(state) || {},
  })
)(class Tweet extends Component {
  constructor(props) {
    super(props)

    this.state = {
      networkError: false,
    }
  }

  async componentDidMount() {
    const currentTime = moment()
    const tasks = [0, 1, 2].map((day) => {
      const date = currentTime.subtract(day, 'days').format('YYYYMMDD')
      return this.fetchTweet(`http://api.kcwiki.moe/tweet/date/${date}`)
    })
    await Promise.all(tasks)

    debounce(this.scheduleNextCheck, 1000)()
  }

  componentWillUnmount() {
    Scheduler.clear()
  }

  async fetchTweet(url) {
    console.log(`fetching new tweets at ${moment.now()}`)
    const resp = await fetch(url)
    const contentType = resp.headers.get('content-type')
    let json = []
    let networkError = false
    if (contentType && contentType.indexOf('json') !== -1) {
      json = await resp.json()
    } else {
      networkError = true
      console.warn(`invalid response got from ${url}`)
    }

    if (json.length > 0) {
      dispatch(onAddTweet(keyBy(json, 'id')))
    }

    if (this.state.networkError !== networkError) {
      this.setSate({
        networkError,
      })
    }
  }

  handleCheckNew = () => {
    this.fetchTweet(`http://api.kcwiki.moe/tweet/date/${moment().format('YYYYMMDD')}`)
    Scheduler.clear()
    this.scheduleNextCheck()
  }

  scheduleNextCheck = () => {
    const tz = moment.tz.guess()
    const currentTime = moment.tz(tz)
    const currentTimeJP = currentTime.clone().tz('Asia/Tokyo')
    let nextCheckTime = 0
    const { tweets } = this.props
    const recentCount = Object.keys(tweets).filter((id) => {
      const tweet = tweets[id]
      const date = moment.tz(tweet.date, 'Asia/Shanghai')
      if (date.isValid()) {
        const diff = date.diff(currentTime, 'minutes')
        return diff > -10
      }
      return false
    }).length

    if (recentCount > 0) {
      nextCheckTime = currentTime + (Math.max(5.0 / recentCount, 2) * 60 * 1000)
    } else if (currentTimeJP.hour() > 7 && currentTimeJP.hour() < 11) {
      nextCheckTime = currentTime + (10 * 60 * 1000)
    } else {
      nextCheckTime = currentTime + (20 * 60 * 1000)
    }

    Scheduler.schedule(this.handleCheckNew, nextCheckTime)
  }

  render() {
    const { tweets } = this.props
    const { networkError } = this.state
    return (
      <div id="plugin-tweet">
        <link href={path.join(__dirname, 'assets', 'style.css')} rel="stylesheet" />
        <header>
          <Button title="@Kancolle-STAFF" onClick={openURL('https://twitter.com/KanColle_STAFF')}>
            <FontAwesome name="twitter" />
          </Button>
          <Button title="kcwiki forwarding" onClick={openURL('https://t.kcwiki.moe/')}>
            <FontAwesome name="book" />
          </Button>
          <Button title="Check news" onClick={this.handleCheckNew}>
            <FontAwesome name="refresh" />
          </Button>
          {
            networkError &&
            <Label bsStyle="danger">
              <FontAwesome name="unlink" /> Network Error
            </Label>
          }
        </header>
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
