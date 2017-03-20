import React, { Component } from 'react'
import { keyBy, sortBy, debounce } from 'lodash'
import { connect } from 'react-redux'
import moment from 'moment-timezone'
import path from 'path'
import { Button, Label, ButtonGroup } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { observe } from 'redux-observers'
import { store } from 'views/create-store'
import { promisify } from 'bluebird'
import { readJson } from 'fs-extra'

import { extensionSelectorFactory } from 'views/utils/selectors'

import { onAddTweet, reducer as _reducer, tweetObserver } from './redux'
import { PLUGIN_KEY, HISTORY_PATH } from './constants'
import TweetView from './views/tweet-view'
import { openURL, LOCAL_TIMEZONE } from './utils'
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
      nextMaintenance: moment(),
    }
  }

  async componentDidMount() {
    this.cancelObserver = observe(store, [tweetObserver])

    await this.fetchMaintenance()

    try {
      const history = await promisify(readJson)(HISTORY_PATH)
      dispatch(onAddTweet(history))
    } catch (e) {
      console.log(e.stack)
    }

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
    if (typeof this.cancelObserver !== 'undefined') {
      this.cancelObserver()
    }
  }

  async fetchMaintenance() {
    const resp = await fetch('https://zh.kcwiki.moe/api.php?action=parse&page=Template:%E7%BB%B4%E6%8A%A4%E5%80%92%E6%95%B0&prop=wikitext&format=json')

    const text = await resp.text()

    const nextTime = text.match(/\d{4}(?:\/\d{1,2}){2} \d{1,2}(?::\d{1,2}){2} \+\d{4}/)

    this.setState({
      nextMaintenance: moment(nextTime, 'YYYY/MM/DD hh:mm:ss Z'),
    })
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
      this.setState({
        networkError,
      })
    }
  }

  handleCheckNew = () => {
    this.fetchTweet(`http://api.kcwiki.moe/tweet/date/${moment().format('YYYYMMDD')}`)
    Scheduler.clear()
    this.scheduleNextCheck()
  }

  handleFetchMaintenance = () => {
    this.fetchMaintenance()
  }

  scheduleNextCheck = () => {
    const currentTime = moment.tz(LOCAL_TIMEZONE)
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
    const { networkError, nextMaintenance } = this.state
    return (
      <div id="plugin-tweet">
        <link href={path.join(__dirname, 'assets', 'style.css')} rel="stylesheet" />
        <header>
          <ButtonGroup block>
            <Button title="@Kancolle-STAFF" onClick={openURL('https://twitter.com/KanColle_STAFF')}>
              <FontAwesome name="twitter" />
            </Button>
            <Button title="kcwiki forwarding" onClick={openURL('https://t.kcwiki.moe/')}>
              <FontAwesome name="book" />
            </Button>
            <Button title="Check news" onClick={this.handleCheckNew}>
              {
                networkError
                ? <a><FontAwesome name="unlink" /> Network Error</a>
                : <a><FontAwesome name="refresh" /></a>
              }
            </Button>
            <Button title="Check next maintenance time" onClick={this.handleFetchMaintenance}>
              Next maintenance:
              {
                nextMaintenance - moment() > 0
                ? nextMaintenance.format(' YYYY-MM-DD HH:mm')
                : ' Unknown'
              }
            </Button>
          </ButtonGroup>
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
