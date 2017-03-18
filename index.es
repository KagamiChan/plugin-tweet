import React, { Component } from 'react'
import { keyBy } from 'lodash'
import { connect } from 'react-redux'
import { Panel, ListGroup, ListGroupItem } from 'react-bootstrap'
import sanitizeHTML from 'sanitize-html'

import { extensionSelectorFactory } from 'views/utils/selectors'

import { onAddTweet, reducer as _reducer } from './redux'
import { PLUGIN_KEY } from './constants'

const safeScreen = text => ({
  __html: sanitizeHTML(text, {
    allowedTags: ['br'],
  }),
})

const Tweet = connect(
  state => ({
    tweets: extensionSelectorFactory(PLUGIN_KEY)(state) || {},
  })
)(
class Tweet extends Component {
  async componentDidMount() {
    const resp = await fetch('http://api.kcwiki.moe/tweet/date/20170317')
    const contentType = resp.headers.get('content-type')
    let json = {}
    if (contentType && contentType.indexOf('json') !== -1) {
      json = await resp.json()
    } else {
      console.warn(`invalid response got from http://api.kcwiki.moe/tweet/date/20170317`)
    }

    dispatch(onAddTweet(keyBy(json, 'id')))
  }

  render() {
    const { tweets } = this.props
    return (
      <div>
        {
          Object.keys(tweets).map(id =>
              <Panel key={id} header={tweets[id].date} bsStyle="info">
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
