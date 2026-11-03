import path from 'node:path'

import { browserAppForPath } from './safety.js'

/**
 * A deliberately conservative, maintainable catalog. The first matching rule
 * wins, so specific products must sit before their vendor umbrella.
 * `test` runs against the full lower-case path plus the extracted folder name.
 */
const APP_RULES = [
  {
    key: 'microsoft-edge',
    test: /microsoft[\\/]edge|edge[\\/]user data|\|microsoft edge$/,
    name: '微软 Edge 浏览器',
    original: 'Microsoft Edge',
    company: '微软',
  },
  {
    key: 'google-chrome',
    test: /google[\\/]chrome|chrome[\\/]user data|\|google chrome$/,
    name: '谷歌 Chrome 浏览器',
    original: 'Google Chrome',
    company: '谷歌',
  },
  {
    key: 'mozilla-firefox',
    test: /mozilla[\\/]firefox|firefox[\\/]profiles|\|mozilla firefox$/,
    name: 'Mozilla Firefox 火狐浏览器',
    original: 'Mozilla Firefox',
    company: 'Mozilla',
  },
  {
    key: 'brave',
    test: /brave[\\/]user data|bravesoftware|\|brave$/,
    name: 'Brave 浏览器',
    original: 'Brave',
    company: 'Brave Software',
  },
  {
    key: 'opera',
    test: /opera software|opera[\\/]user data|\|opera$/,
    name: 'Opera 浏览器',
    original: 'Opera',
    company: 'Opera',
  },
  {
    key: 'vivaldi',
    test: /vivaldi[\\/]user data|\|vivaldi$/,
    name: 'Vivaldi 浏览器',
    original: 'Vivaldi',
    company: 'Vivaldi',
  },
  {
    key: '360-browser',
    test: /360se|360chrome|360极速|360安全|\|360 浏览器$/,
    name: '360 浏览器',
    original: '360 Browser',
    company: '三六零',
  },
  {
    key: 'sogou-browser',
    test: /sogou.*explorer|sogouexplorer|\|搜狗浏览器$/,
    name: '搜狗浏览器',
    original: 'Sogou Explorer',
    company: '搜狗',
  },
  {
    key: 'microsoft-teams',
    test: /microsoft[\\/]teams|\|microsoft teams$|\|teams$/,
    name: '微软 Teams',
    original: 'Microsoft Teams',
    company: '微软',
  },
  {
    key: 'microsoft-onedrive',
    test: /microsoft[\\/]onedrive|\|onedrive$/,
    name: '微软 OneDrive',
    original: 'Microsoft OneDrive',
    company: '微软',
  },
  {
    key: 'microsoft-office',
    test: /microsoft[\\/]office|\|microsoft office$|\|office$/,
    name: '微软 Office',
    original: 'Microsoft Office',
    company: '微软',
  },
  {
    key: 'microsoft-vscode',
    test: /microsoft[\\/]vs ?code|microsoft[\\/]code|\|visual studio code$|\|vs code$/,
    name: '微软 Visual Studio Code',
    original: 'Visual Studio Code',
    company: '微软',
  },
  {
    key: 'microsoft-windows',
    test: /[\\/]windows[\\/]|[\\/]windows$|\|微软 windows$|\|windows$/,
    name: '微软 Windows',
    original: 'Windows',
    company: '微软',
  },
  {
    key: 'microsoft',
    test: /[\\/]microsoft[\\/]|[\\/]microsoft$|\|微软$/,
    name: '微软',
    original: 'Microsoft',
    company: '微软',
  },
  {
    key: 'tencent-qq',
    test: /[\\/]tencent[\\/].*[\\/]qq(?:[\\/]|$)|[\\/]qq(?:nt)?(?:[\\/]|$)|\|腾讯 qq$|\|qq$/,
    name: '腾讯 QQ',
    original: 'Tencent QQ',
    company: '腾讯',
  },
  {
    key: 'tencent-wechat',
    test: /[\\/]wechat(?:[\\/]|$)|[\\/]weixin(?:[\\/]|$)|\|wechat$|\|微信$/,
    name: '微信',
    original: 'WeChat',
    company: '腾讯',
  },
  {
    key: 'tencent-wecom',
    test: /[\\/]wxwork(?:[\\/]|$)|[\\/]wework(?:[\\/]|$)|\|企业微信$/,
    name: '企业微信',
    original: 'WeCom',
    company: '腾讯',
  },
  {
    key: 'tencent-video',
    test: /qqlive|tencentvideo|tencent[\\/]video|\|腾讯视频$/,
    name: '腾讯视频',
    original: 'Tencent Video',
    company: '腾讯',
  },
  {
    key: 'tencent-meeting',
    test: /wemeet|tencent[\\/]meeting|\|腾讯会议$/,
    name: '腾讯会议',
    original: 'Tencent Meeting',
    company: '腾讯',
  },
  {
    key: 'tencent',
    test: /[\\/]tencent[\\/]|[\\/]tencent$|\|腾讯$/,
    name: '腾讯',
    original: 'Tencent',
    company: '腾讯',
  },
  {
    key: 'netease-cloudmusic',
    test: /cloudmusic|netease[\\/].*music|网易云音乐|\|网易云音乐$/,
    name: '网易云音乐',
    original: 'NetEase CloudMusic',
    company: '网易',
  },
  {
    key: 'netease-youdao',
    test: /yodao|youdao|网易有道|\|有道$/,
    name: '网易有道',
    original: 'NetEase Youdao',
    company: '网易',
  },
  {
    key: 'netease-mumu',
    test: /mumuplayer|mumu|网易mumu|\|mumu模拟器$/,
    name: '网易 MuMu 模拟器',
    original: 'NetEase MuMu Player',
    company: '网易',
  },
  {
    key: 'netease',
    test: /[\\/]netease[\\/]|[\\/]netease$|\|网易$/,
    name: '网易',
    original: 'NetEase',
    company: '网易',
  },
  {
    key: 'mihoyo',
    test: /mihoyo|hoyoverse|olivia-steam|hyp[\\/]|\|米哈游$/,
    name: '米哈游',
    original: 'miHoYo / HoYoverse',
    company: '米哈游',
  },
  {
    key: 'genshin',
    test: /genshin|yuanshen|\|原神$/,
    name: '原神',
    original: 'Genshin Impact',
    company: '米哈游',
  },
  {
    key: 'star-rail',
    test: /starrail|star rail|\|星穹铁道$/,
    name: '崩坏：星穹铁道',
    original: 'Honkai: Star Rail',
    company: '米哈游',
  },
  {
    key: 'zenless',
    test: /zenless|绝区零|\|绝区零$/,
    name: '绝区零',
    original: 'Zenless Zone Zero',
    company: '米哈游',
  },
  {
    key: 'adobe-premiere',
    test: /premiere|media encoder|peak files|media cache|\|adobe premiere/,
    name: 'Adobe Premiere Pro',
    original: 'Adobe Premiere Pro',
    company: 'Adobe（奥多比）',
  },
  {
    key: 'adobe-photoshop',
    test: /photoshop|\|adobe photoshop/,
    name: 'Adobe Photoshop',
    original: 'Adobe Photoshop',
    company: 'Adobe（奥多比）',
  },
  {
    key: 'adobe-after-effects',
    test: /after effects|\|adobe after effects/,
    name: 'Adobe After Effects',
    original: 'Adobe After Effects',
    company: 'Adobe（奥多比）',
  },
  {
    key: 'adobe-acrobat',
    test: /acrobat|adobe reader|\|acrobat/,
    name: 'Adobe Acrobat',
    original: 'Adobe Acrobat',
    company: 'Adobe（奥多比）',
  },
  {
    key: 'adobe',
    test: /[\\/]adobe[\\/]|[\\/]adobe$|\|adobe$/,
    name: 'Adobe',
    original: 'Adobe',
    company: 'Adobe（奥多比）',
  },
  {
    key: 'nvidia',
    test: /nvidia|\|英伟达$/,
    name: '英伟达',
    original: 'NVIDIA',
    company: '英伟达',
  },
  {
    key: 'amd',
    test: /(?:^|[\\/])amd(?:[\\/]|$)|radeon|\|amd$/,
    name: 'AMD',
    original: 'AMD',
    company: 'AMD',
  },
  {
    key: 'intel',
    test: /[\\/]intel[\\/]|[\\/]intel$|\|英特尔$/,
    name: '英特尔',
    original: 'Intel',
    company: '英特尔',
  },
  {
    key: 'steam',
    test: /[\\/]steam(?:library|apps)?(?:[\\/]|$)|\|steam$/,
    name: 'Steam',
    original: 'Steam',
    company: 'Valve',
  },
  {
    key: 'epic-games',
    test: /epic ?games|epicgames|\|epic games$/,
    name: 'Epic Games',
    original: 'Epic Games',
    company: 'Epic Games',
  },
  {
    key: 'blizzard',
    test: /battle\.net|blizzard|\|暴雪战网$/,
    name: '暴雪战网',
    original: 'Blizzard Battle.net',
    company: '暴雪',
  },
  {
    key: 'riot',
    test: /riot games|riotclient|\|拳头游戏$/,
    name: '拳头游戏',
    original: 'Riot Games',
    company: 'Riot Games',
  },
  {
    key: 'ea',
    test: /electronic arts|origin[\\/]|\|ea app$/,
    name: 'EA',
    original: 'Electronic Arts',
    company: 'Electronic Arts',
  },
  {
    key: 'ubisoft',
    test: /ubisoft|uplay|\|育碧$/,
    name: '育碧',
    original: 'Ubisoft',
    company: 'Ubisoft',
  },
  {
    key: 'rockstar',
    test: /rockstar games|\|rockstar$/,
    name: 'Rockstar Games',
    original: 'Rockstar Games',
    company: 'Rockstar Games',
  },
  {
    key: 'wegame',
    test: /wegame|\|腾讯wegame$/,
    name: '腾讯 WeGame',
    original: 'Tencent WeGame',
    company: '腾讯',
  },
  {
    key: 'kingsoft-wps',
    test: /[\\/]wps(?: office)?(?:[\\/]|$)|kingsoft|\|wps$|\|金山/,
    name: '金山 WPS Office',
    original: 'Kingsoft WPS Office',
    company: '金山',
  },
  {
    key: 'sogou',
    test: /[\\/]sogou[\\/]|[\\/]sogou$|\|搜狗$/,
    name: '搜狗',
    original: 'Sogou',
    company: '搜狗',
  },
  {
    key: '360',
    test: /360safe|360se|360chrome|360sd|360drvmgr|\|360/,
    name: '360 安全卫士',
    original: '360 Security',
    company: '三六零',
  },
  {
    key: 'youdao',
    test: /yodao|youdao|\|有道$/,
    name: '网易有道',
    original: 'NetEase Youdao',
    company: '网易',
  },
  {
    key: 'thunder',
    test: /[\\/]thunder(?: network)?(?:[\\/]|$)|\|迅雷$/,
    name: '迅雷',
    original: 'Thunder',
    company: '迅雷',
  },
  {
    key: 'bilibili',
    test: /bilibili|哔哩哔哩|\|b站$/,
    name: '哔哩哔哩',
    original: 'Bilibili',
    company: '哔哩哔哩',
  },
  {
    key: 'iqiyi',
    test: /iqiyi|爱奇艺/,
    name: '爱奇艺',
    original: 'iQIYI',
    company: '爱奇艺',
  },
  {
    key: 'youku',
    test: /youku|优酷/,
    name: '优酷',
    original: 'Youku',
    company: '阿里巴巴',
  },
  {
    key: 'qqmusic',
    test: /qqmusic|qq音乐/,
    name: 'QQ 音乐',
    original: 'QQ Music',
    company: '腾讯',
  },
  {
    key: 'kugou',
    test: /kugou|酷狗/,
    name: '酷狗音乐',
    original: 'Kugou Music',
    company: '腾讯',
  },
  {
    key: 'baidu',
    test: /[\\/]baidu[\\/]|[\\/]baidu$|\|百度/,
    name: '百度',
    original: 'Baidu',
    company: '百度',
  },
  {
    key: 'alibaba',
    test: /alibaba|taobao|阿里|\|淘宝/,
    name: '阿里巴巴',
    original: 'Alibaba',
    company: '阿里巴巴',
  },
  {
    key: 'bytedance',
    test: /bytedance|douyin|字节跳动|\|抖音/,
    name: '字节跳动',
    original: 'ByteDance',
    company: '字节跳动',
  },
  {
    key: 'dingtalk',
    test: /dingtalk|钉钉/,
    name: '钉钉',
    original: 'DingTalk',
    company: '阿里巴巴',
  },
  {
    key: 'feishu',
    test: /feishu|lark|飞书/,
    name: '飞书',
    original: 'Feishu / Lark',
    company: '字节跳动',
  },
  {
    key: 'huawei',
    test: /huawei|华为/,
    name: '华为',
    original: 'Huawei',
    company: '华为',
  },
  {
    key: 'xiaomi',
    test: /xiaomi|小米/,
    name: '小米',
    original: 'Xiaomi',
    company: '小米',
  },
  {
    key: 'discord',
    test: /discord/,
    name: 'Discord',
    original: 'Discord',
    company: 'Discord',
  },
  {
    key: 'slack',
    test: /slack/,
    name: 'Slack',
    original: 'Slack',
    company: 'Salesforce',
  },
  {
    key: 'zoom',
    test: /zoom/,
    name: 'Zoom',
    original: 'Zoom',
    company: 'Zoom',
  },
  {
    key: 'telegram',
    test: /telegram/,
    name: 'Telegram',
    original: 'Telegram',
    company: 'Telegram',
  },
  {
    key: 'whatsapp',
    test: /whatsapp/,
    name: 'WhatsApp',
    original: 'WhatsApp',
    company: 'Meta',
  },
  {
    key: 'skype',
    test: /skype/,
    name: 'Skype',
    original: 'Skype',
    company: '微软',
  },
  {
    key: 'spotify',
    test: /spotify/,
    name: 'Spotify',
    original: 'Spotify',
    company: 'Spotify',
  },
  {
    key: 'obs',
    test: /obs-studio|obs studio|\|obs$/,
    name: 'OBS Studio',
    original: 'OBS Studio',
    company: 'OBS Project',
  },
  {
    key: 'vlc',
    test: /videolan|vlc/,
    name: 'VLC 播放器',
    original: 'VLC media player',
    company: 'VideoLAN',
  },
  {
    key: 'potplayer',
    test: /potplayer|daum/,
    name: 'PotPlayer',
    original: 'PotPlayer',
    company: 'Kakao',
  },
  {
    key: 'idm',
    test: /internet download manager|[\\/]idm(?:[\\/]|$)/,
    name: 'Internet Download Manager',
    original: 'Internet Download Manager',
    company: 'Tonec',
  },
  {
    key: 'motrix',
    test: /motrix/,
    name: 'Motrix',
    original: 'Motrix',
    company: 'Motrix',
  },
  {
    key: 'qbittorrent',
    test: /qbittorrent/,
    name: 'qBittorrent',
    original: 'qBittorrent',
    company: 'qBittorrent',
  },
  {
    key: 'everything',
    test: /[\\/]everything(?:[\\/]|$)/,
    name: 'Everything 搜索工具',
    original: 'Everything',
    company: 'voidtools',
  },
  {
    key: '7zip',
    test: /7-zip|7zip/,
    name: '7-Zip',
    original: '7-Zip',
    company: 'Igor Pavlov',
  },
  {
    key: 'winrar',
    test: /winrar/,
    name: 'WinRAR',
    original: 'WinRAR',
    company: 'RARLAB',
  },
  {
    key: 'git',
    test: /[\\/]git(?:[\\/]|$)/,
    name: 'Git',
    original: 'Git',
    company: 'Git',
  },
  {
    key: 'nodejs',
    test: /nodejs|node_modules|npm-cache|[\\/]npm(?:[\\/]|$)/,
    name: 'Node.js 包管理器',
    original: 'Node.js / npm',
    company: 'OpenJS Foundation',
  },
  {
    key: 'pnpm',
    test: /pnpm/,
    name: 'pnpm 包管理器',
    original: 'pnpm',
    company: 'pnpm',
  },
  {
    key: 'pip',
    test: /[\\/]pip[\\/]|pip-cache|pip cache/,
    name: 'Python pip',
    original: 'pip',
    company: 'Python Software Foundation',
  },
  {
    key: 'gradle',
    test: /[\\/]gradle[\\/]|gradle caches/,
    name: 'Gradle',
    original: 'Gradle',
    company: 'Gradle',
  },
  {
    key: 'cargo',
    test: /[\\/]cargo[\\/]|cargo registry/,
    name: 'Rust Cargo',
    original: 'Cargo',
    company: 'Rust Foundation',
  },
  {
    key: 'nuget',
    test: /[\\/]nuget[\\/]|nuget cache/,
    name: 'NuGet',
    original: 'NuGet',
    company: '微软',
  },
  {
    key: 'yarn',
    test: /[\\/]yarn[\\/]|yarn cache/,
    name: 'Yarn',
    original: 'Yarn',
    company: 'Yarn',
  },
  {
    key: 'windows-recycle',
    test: /\$recycle\.bin|回收站/,
    name: '微软 Windows 回收站',
    original: 'Windows Recycle Bin',
    company: '微软',
  },
  {
    key: 'windows-temp',
    test: /\$windows\.~bt|\$windows\.~ws|windows\.old/,
    name: '微软 Windows 升级残留',
    original: 'Windows upgrade leftovers',
    company: '微软',
  },
]

const GENERIC_APP_NAMES = new Set([
  'common',
  'common files',
  'data',
  'default',
  'local',
  'locallow',
  'roaming',
  'packages',
  'programs',
  'publishers',
  'temp',
  'tmp',
  'cache',
  'caches',
  'logs',
  'log',
  'update',
  'updater',
  'updates',
  'installer',
  'installers',
  'backup',
  'backups',
  'resources',
  'shared',
  'app',
  'apps',
  'user data',
  'userdata',
  'config',
  'settings',
])

function normalize(value) {
  return String(value || '').replace(/\//g, '\\').toLowerCase()
}

export function isChineseText(value) {
  return /[\u3400-\u9fff]/.test(String(value || ''))
}

export function rawAppNameForPath(filePath, fallback) {
  const browser = browserAppForPath(filePath)
  if (browser) return browser
  const parts = String(filePath).split(/[\\/]+/).filter(Boolean)
  const lower = parts.map((part) => part.toLowerCase())
  const appDataIndex = lower.lastIndexOf('appdata')
  if (appDataIndex >= 0 && appDataIndex + 2 < parts.length) {
    const area = lower[appDataIndex + 1]
    if (['local', 'roaming', 'locallow'].includes(area)) {
      let app = parts[appDataIndex + 2]
      if (app.toLowerCase() === 'microsoft' && parts[appDataIndex + 3]) {
        app = `Microsoft ${parts[appDataIndex + 3]}`
      }
      return app.replace(/[-_ ]?updater$/i, '').trim() || fallback || '其他'
    }
  }
  if (fallback) return String(fallback).replace(/[-_ ]?updater$/i, '').trim() || '其他'
  if (parts.length > 0) return parts[parts.length - 1]
  return '其他'
}

/**
 * Resolve a path to a stable display identity. Unknown applications fall back
 * to the directory name instead of inventing a translation.
 * @param {string} filePath
 * @param {string} [fallback]
 * @returns {{app: string, appOriginal: string, company: string, appKey: string}}
 */
export function identifyApp(filePath, fallback) {
  const raw = rawAppNameForPath(filePath, fallback)
  const probe = `${normalize(filePath)}|${normalize(raw)}`
  const lowerRaw = normalize(raw)
  for (const rule of APP_RULES) {
    if (rule.test.test(probe)) {
      return {
        app: rule.name,
        appOriginal: rule.original || raw,
        company: rule.company || '',
        appKey: rule.key,
      }
    }
  }
  if (GENERIC_APP_NAMES.has(lowerRaw)) {
    const parent = String(filePath).split(/[\\/]+/).filter(Boolean).slice(-2, -1)[0] || raw
    return {
      app: parent,
      appOriginal: parent,
      company: '',
      appKey: normalize(parent) || 'other',
    }
  }
  return {
    app: raw,
    appOriginal: isChineseText(raw) ? '' : raw,
    company: '',
    appKey: lowerRaw || 'other',
  }
}

export { APP_RULES, GENERIC_APP_NAMES }
