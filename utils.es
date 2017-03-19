import sanitizeHTML from 'sanitize-html'
import moment from 'moment-timezone'
import { shell } from 'electron'

const LOCAL_TIMEZONE = moment.tz.guess()

export const safeScreen = text => ({
  __html: sanitizeHTML(text, {
    allowedTags: ['br'],
  }),
})

export const convertTimeZone = (timeStr, tz = LOCAL_TIMEZONE) => {
  if (!moment(timeStr).isValid()) {
    console.warn(`time string cannot be parsed, ${timeStr}`)
    return timeStr
  }
  const timeShanghai = moment.tz(timeStr, 'Asia/Shanghai')
  return timeShanghai.clone().tz(tz).format('YYYY-MM-DD HH:mm:ss')
}

export const openURL = url => () => shell.openExternal(url)

