import React from 'react'
import { Panel, ListGroup, ListGroupItem } from 'react-bootstrap'
import { connect } from 'react-redux'

import { convertTimeZone, safeScreen } from '../utils'

const TweetView = connect(

)(({ tweet: { id, date, jp, zh, img } }) =>
  <Panel header={convertTimeZone(date)} bsStyle="info">
    <ListGroup fill>
      <ListGroupItem dangerouslySetInnerHTML={safeScreen(jp || '')} />
      {zh && <ListGroupItem dangerouslySetInnerHTML={safeScreen(zh)} />}
    </ListGroup>
  </Panel>
)

export default TweetView
