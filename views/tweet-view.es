import React from 'react'
import { Panel, ListGroup, ListGroupItem, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'

import { convertTimeZone, safeScreen, openURL } from '../utils'

const TweetView = ({ tweet: { id, date, jp, zh, img } }) => {
  const tooltip = (
    <Tooltip>
      <img
        src="https://static.kcwiki.moe/KanColleStaffAvatar.png"
        alt="Kancolle Staff Avatar"
        className="plugin-tweet avatar large"
      />
    </Tooltip>
    )
  const header = (
    <div>
      <OverlayTrigger overlay={tooltip} placement="bottom">
        <img
          src="https://static.kcwiki.moe/KanColleStaffAvatar.png"
          alt="Kancolle Staff Avatar"
          className="avatar small"
          onClick={openURL('https://static.kcwiki.moe/KanColleStaffAvatar.png')}
        />
      </OverlayTrigger>
      {convertTimeZone(date)}
    </div>
    )
  return (
    <Panel header={header} bsStyle="info">
      <ListGroup fill>
        <ListGroupItem dangerouslySetInnerHTML={safeScreen(jp || '')} />
        {zh && <ListGroupItem dangerouslySetInnerHTML={safeScreen(zh)} />}
      </ListGroup>
    </Panel>
  )
}

export default connect()(TweetView)
