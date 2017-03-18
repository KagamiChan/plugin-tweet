import path from 'path'

const { APPDATA_PATH } = window

export const PLUGIN_KEY = 'poi-plugin-tweet'
export const HISTORY_PATH = path.join(APPDATA_PATH, 'kctweets.json')
