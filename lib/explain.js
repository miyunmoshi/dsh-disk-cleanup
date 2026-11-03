import path from 'node:path'

export const CATEGORY_ORDER = [
  'temp',
  'browser',
  'appcache',
  'update',
  'uninstall',
  'logs',
  'devcache',
  'recycle',
  'large',
  'duplicate',
]

export const CATEGORY_IDS = new Set(CATEGORY_ORDER)

export const KIND_ORDER = ['cache', 'logs', 'residue', 'updater', 'temp', 'duplicate', 'large', 'recycle']

export const KIND_OF_CATEGORY = {
  temp: 'temp',
  browser: 'cache',
  appcache: 'cache',
  update: 'updater',
  uninstall: 'residue',
  logs: 'logs',
  devcache: 'cache',
  recycle: 'recycle',
  large: 'large',
  duplicate: 'duplicate',
}

export function kindOfCategory(categoryId) {
  return KIND_OF_CATEGORY[categoryId] || 'cache'
}

const RESIDUAL_EXTENSIONS = new Set([
  '.tmp',
  '.log',
  '.dmp',
  '.mdmp',
  '.hdmp',
  '.etl',
  '.trace',
  '.old',
  '.bak',
  '.pdb',
  '.exe',
  '.msi',
  '.msix',
  '.msixbundle',
  '.cab',
  '.zip',
  '.7z',
  '.rar',
  '.nupkg',
])

export function isResidualFile(filePath, size) {
  const ext = extensionOf(filePath)
  if (!RESIDUAL_EXTENSIONS.has(ext)) return false
  if (ext === '.log' && size < 4 * 1024) return false
  if (['.exe', '.msi', '.msix', '.msixbundle', '.zip', '.7z', '.rar', '.nupkg'].includes(ext) && size < 1024 * 1024) {
    return false
  }
  return size >= 1024
}

/**
 * Directory-name rules for volumes outside the system drive. Only recognized
 * junk containers are collected; arbitrary user folders are not traversed as
 * file candidates.
 */
export function classifyExtraDriveDirectory(name, fullPath) {
  const lower = String(name).toLowerCase()
  if (/^(windows\.old|\$windows\.~bt|\$windows\.~ws|\$winreagent|windows\.old\.\d+)$/.test(lower)) {
    return { categoryId: 'update', rule: 'system-leftover', risk: 'caution', requiresAdmin: true }
  }
  if (/(^|[-_. ])crash(pad|dumps?|es)?([-_. ]|$)|崩溃|转储/.test(lower)) {
    return { categoryId: 'logs', rule: 'crash', risk: 'caution' }
  }
  if (/(^|[-_. ])(logs?|日志)([-_. ]|$)/.test(lower)) {
    return { categoryId: 'logs', rule: 'log', risk: 'caution' }
  }
  if (/(^|[-_. ])(cache|caches|缓存)([-_. ]|$)|cache$|缓存$/.test(lower)) {
    return { categoryId: 'appcache', rule: 'app-cache', risk: 'caution' }
  }
  if (/(^|[-_. ])(temp|tmp|临时)([-_. ]|$)|临时$|msdownld\.tmp/.test(lower)) {
    return { categoryId: 'temp', rule: 'temp', risk: 'caution' }
  }
  if (/downloading|incomplete|未完成|下载缓存/.test(lower)) {
    return { categoryId: 'temp', rule: 'incomplete-download', risk: 'caution' }
  }
  if (/updater|更新缓存|update[-_. ]?cache|安装缓存/.test(lower)) {
    return { categoryId: 'update', rule: 'updater', risk: 'caution' }
  }
  if (/uninstall|卸载残留|残留|旧版本|old version/.test(lower)) {
    return { categoryId: 'uninstall', rule: 'uninstall', risk: 'review', requiresAdmin: false }
  }
  return null
}

const INSTALLER_EXTENSIONS = new Set([
  '.exe',
  '.msi',
  '.msix',
  '.msixbundle',
  '.appx',
  '.appxbundle',
  '.zip',
  '.7z',
  '.rar',
  '.cab',
  '.nupkg',
  '.dmg',
  '.pkg',
  '.appimage',
  '.deb',
  '.rpm',
  '.blockmap',
])

const CONFIG_EXTENSIONS = new Set([
  '.json',
  '.xml',
  '.ini',
  '.cfg',
  '.yaml',
  '.yml',
  '.toml',
  '.txt',
  '.log',
  '.db',
  '.sqlite',
  '.lock',
])

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.ts'])
const ARCHIVE_EXTENSIONS = new Set(['.zip', '.7z', '.rar', '.tar', '.gz', '.bz2', '.xz', '.iso'])
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tif', '.tiff', '.heic'])

export function extensionOf(filePath) {
  return path.extname(String(filePath)).toLowerCase()
}

export function isInstallerLike(filePath, size) {
  const ext = extensionOf(filePath)
  if (INSTALLER_EXTENSIONS.has(ext) && size >= 1024 * 1024) return true
  return size >= 20 * 1024 * 1024 && !CONFIG_EXTENSIONS.has(ext)
}

function friendlyFileType(filePath) {
  const ext = extensionOf(filePath)
  if (VIDEO_EXTENSIONS.has(ext)) return '视频'
  if (IMAGE_EXTENSIONS.has(ext)) return '图片'
  if (ARCHIVE_EXTENSIONS.has(ext) || INSTALLER_EXTENSIONS.has(ext)) return '压缩包或安装包'
  if (ext === '.pdf') return 'PDF 文档'
  if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) return '办公文档'
  if (['.psd', '.ai', '.sketch', '.fig', '.blend'].includes(ext)) return '设计工程文件'
  if (['.pdb', '.dmp', '.mdmp'].includes(ext)) return '调试转储'
  if (['.iso', '.img'].includes(ext)) return '磁盘镜像'
  return '用户文件'
}

export function buildExplanation(input) {
  const {
    categoryId,
    rule,
    filePath,
    size,
    ageDays,
    appName,
    appOriginal,
    company,
    duplicateOf,
    requiresAdmin,
    orphanReason,
    locationNote,
  } = input
  const name = path.basename(filePath)
  const app = appName || '该应用'
  const originalLabel = appOriginal && appOriginal !== app ? appOriginal : ''
  const companyLabel = company && !app.includes(company) && !originalLabel.includes(company) ? company : ''
  const appDisplay =
    originalLabel || companyLabel ? `${app}（${[companyLabel, originalLabel].filter(Boolean).join(' / ')}）` : app
  const displayName = name.length > 100 ? `${name.slice(0, 97)}…` : name
  let purpose
  let reason

  switch (rule) {
    case 'browser-cache':
      purpose = `《${displayName}》是 ${appDisplay} 的网页缓存数据块，用来保存图片、脚本、样式和网页资源，以便再次访问时加载更快。`
      reason = `这是可自动重建的浏览器缓存。清理不会删除书签、密码、历史记录或登录状态；建议先关闭 ${appDisplay}，正在写入的缓存文件会自动跳过。`
      break
    case 'browser-code':
      purpose = `《${displayName}》是 ${appDisplay} 的 JavaScript / WebAssembly 编译缓存，用来减少重复解析脚本的时间。`
      reason = `编译缓存会在下次打开网页时自动重建。清理后首次加载网页可能稍慢，不影响书签、密码和登录状态。`
      break
    case 'browser-gpu':
      purpose = `《${displayName}》是 ${appDisplay} 的 GPU 着色器缓存，用来缓存显卡编译结果，提升网页渲染速度。`
      reason = `着色器缓存可自动重建。清理后部分网页首次渲染会稍慢；若显卡驱动异常，重建缓存反而有助于排除问题。`
      break
    case 'browser-sw':
      purpose = `《${displayName}》是网站 Service Worker 的离线资源或脚本缓存，供网页在本地快速加载。`
      reason = `Service Worker 缓存会在网站再次访问时自动更新。清理可能导致少量网站首次打开变慢，但不会删除浏览器账号或书签。`
      break
    case 'app-cache':
      purpose = `《${displayName}》是 ${appDisplay} 的应用缓存文件，保存运行时可以重新生成的数据。`
      reason = `应用缓存可以安全重建。建议先关闭 ${appDisplay}；正在使用的缓存文件会被跳过，并在结果中列明原因。`
      break
    case 'app-code':
      purpose = `《${displayName}》是 ${appDisplay} 的脚本或字节码编译缓存，用来加快下次启动。`
      reason = `编译缓存不属于用户数据，应用会重新生成；清理后首次启动可能稍慢，不会删除应用配置或账号。`
      break
    case 'app-gpu':
      purpose = `《${displayName}》是 ${appDisplay} 的 GPU / 着色器缓存，保存显卡渲染的编译结果。`
      reason = `这类缓存可以自动重建；清理后界面首次渲染可能稍慢。如果应用正在运行，建议先退出。`
      break
    case 'app-sw':
      purpose = `《${displayName}》是 ${appDisplay} 内嵌网页的 Service Worker 缓存，用于离线资源和脚本。`
      reason = `缓存可重新下载或重建；清理可能让应用内网页首次加载稍慢，不会删除账号和业务数据。`
      break
    case 'updater':
      purpose = `《${displayName}》是 ${appDisplay} 更新器下载的安装包、补丁或更新缓存，通常只在升级或回滚时使用。`
      reason = `更新完成后这些文件通常不再需要，清理能释放较多空间；代价是下次更新需要重新下载，并失去用旧安装包回滚的便利。`
      break
    case 'log':
    case 'system-log':
      purpose = `《${displayName}》是 ${appDisplay} 生成的运行日志${extensionOf(filePath) === '.etl' ? '或事件跟踪文件' : ''}，用于记录运行过程和排障。`
      reason = `日志不是程序运行所必需的数据；如果近期正在排查问题，建议保留。清理前请确认没有正在进行的诊断。${requiresAdmin ? ' 该位置属于系统目录，移动失败通常需要管理员权限。' : ''}`
      break
    case 'crash':
      purpose = `《${displayName}》是 ${appDisplay} 崩溃后留下的转储或崩溃报告，包含故障时的内存信息。`
      reason = `崩溃转储只在分析闪退时有用；如果问题已经解决或不再排查，可以清理。文件可能包含程序内存片段，请只在本地处理。`
      break
    case 'temp':
      purpose = `《${displayName}》是 ${appDisplay} 运行过程中生成的临时文件，通常用于安装、解压、转换或会话中间结果。`
      reason = `超过 ${Math.max(1, Math.round(ageDays || 1))} 天且未被占用的临时文件一般可以清理；正在使用的文件会被自动跳过，不会强行关闭程序。${requiresAdmin ? ' 系统临时目录可能需要管理员权限。' : ''}`
      break
    case 'devcache':
      purpose = `《${displayName}》是 ${appDisplay} 的包下载或构建缓存，可以通过重新下载、重新编译恢复。`
      reason = `这不是项目源码或用户文档。清理后首次安装、构建或打开项目会变慢，并且需要网络重新获取依赖；离线环境建议保留。`
      break
    case 'recycle':
      purpose = `《${displayName}》是位于 Windows 回收站中的已删除项目，仍可能被还原到原位置。`
      reason = `本插件不会直接修改回收站。请先打开 Windows 回收站确认内容；只有确定不再需要时，才在系统中清空回收站。`
      break
    case 'large':
      purpose = `《${displayName}》是用户目录中的 ${friendlyFileType(filePath)}，体积较大，可能是素材、备份、安装包、项目产物或旧资料。`
      reason = `这是受保护的用户文件，插件不会默认选中。请先确认它是否仍被需要；移入插件隔离区后可以恢复，但仍建议先自行打开或备份确认。`
      break
    case 'duplicate':
      purpose = `《${displayName}》与另一份文件的字节内容完全相同（SHA-256 校验一致），是可能冗余的 ${friendlyFileType(filePath)}。`
      reason = `同一内容的多个副本通常只需要保留一份，建议保留修改时间较新的副本${duplicateOf ? `：${duplicateOf}` : ''}。请先确认这不是你有意保留的版本；移入隔离区后仍可恢复。`
      break
    case 'uninstall':
      purpose = `《${displayName}》位于疑似已卸载应用 ${appDisplay} 的数据目录中。系统已安装程序登记里没有找到对应应用，因此它可能是卸载后留下的缓存、日志或旧版本文件。`
      reason = `判断依据：${orphanReason || '对应应用未出现在已安装程序登记中，且目录长期没有更新'}。这不是系统或当前已安装程序正在使用的数据；但便携软件也可能没有安装登记，请先确认。移入隔离区后仍可恢复。`
      break
    case 'system-leftover':
      purpose = `《${displayName}》是 Windows 安装或升级后留下的旧系统文件（例如 Windows.old），用于回退或恢复上一版系统。`
      reason = `这类文件通常占用空间较大，清理前请确认系统运行稳定且不再需要回退；移动通常需要管理员权限，失败时会列明原因。`
      break
    case 'incomplete-download':
      purpose = `《${displayName}》是下载器或游戏平台留下的未完成下载、临时分块或缓存文件。`
      reason = `如果相关下载任务已经取消或不再需要，可以清理；如果任务仍在进行，文件可能被占用或仍在使用，程序会跳过无法移动的项目。`
      break
    default:
      purpose = `《${displayName}》是可清理的缓存或临时数据。`
      reason = `请确认用途后再决定是否移入隔离区。`
  }

  if (locationNote) reason = `${reason} ${locationNote}`
  return {
    categoryId,
    kind: kindOfCategory(categoryId),
    purpose,
    reason,
    cleanable: categoryId !== 'recycle',
  }
}

export function categoryForCacheDir(name, fullPath, browserApp) {
  const lower = name.toLowerCase()
  const browser = Boolean(browserApp)
  if (['cache', 'cache_data', 'caches', 'inetcache', 'temporary internet files'].includes(lower)) {
    return { categoryId: browser ? 'browser' : 'appcache', rule: browser ? 'browser-cache' : 'app-cache', risk: 'safe' }
  }
  if (lower === 'code cache' || lower === 'cacheddata' || lower === 'codecache') {
    return { categoryId: browser ? 'browser' : 'appcache', rule: browser ? 'browser-code' : 'app-code', risk: 'safe' }
  }
  if (
    [
      'gpucache',
      'gpu cache',
      'dawncache',
      'dawngraphitecache',
      'dawnwebgpucache',
      'grshadercache',
      'shadercache',
      'gpushadercache',
      'd3dscache',
      'dxcache',
      'glcache',
      'gshadercache',
    ].includes(lower)
  ) {
    return { categoryId: browser ? 'browser' : 'appcache', rule: browser ? 'browser-gpu' : 'app-gpu', risk: 'safe' }
  }
  if (['cachestorage', 'scriptcache'].includes(lower)) {
    return { categoryId: browser ? 'browser' : 'appcache', rule: browser ? 'browser-sw' : 'app-sw', risk: 'safe' }
  }
  if (['component_crx_cache'].includes(lower)) {
    return { categoryId: browser ? 'browser' : 'appcache', rule: browser ? 'browser-cache' : 'app-cache', risk: 'safe' }
  }
  return null
}

export function specialDirectoryRule(name, fullPath, browserApp) {
  const lower = name.toLowerCase()
  const cache = categoryForCacheDir(name, fullPath, browserApp)
  if (cache) return { type: 'cache', ...cache }
  if (['crashpad', 'crashdumps', 'crashes', 'minidumps'].includes(lower)) {
    return { type: 'crash', categoryId: 'logs', rule: 'crash', risk: 'safe' }
  }
  if (['logs', 'log'].includes(lower) && !browserApp) {
    return { type: 'logs', categoryId: 'logs', rule: 'log', risk: 'safe' }
  }
  if (
    lower.endsWith('-updater') ||
    lower.endsWith('_updater') ||
    lower.endsWith(' updater') ||
    lower === 'updater' ||
    lower === 'updater-cache' ||
    lower === 'update-cache' ||
    lower === 'updates-cache'
  ) {
    return { type: 'updater', categoryId: 'update', rule: 'updater', risk: 'caution' }
  }
  return null
}

export function fileRule(filePath, size, ageDays, browserApp) {
  const lower = path.basename(filePath).toLowerCase()
  const ext = extensionOf(filePath)
  if (lower === 'lock' || lower === 'lockfile' || lower.endsWith('.lock') || lower === 'singletonlock') return null
  if (ageDays < 2) return null
  if (['.dmp', '.mdmp', '.hdmp'].includes(ext)) {
    return { categoryId: 'logs', rule: 'crash', risk: 'safe' }
  }
  if (['.tmp', '.partial', '.crdownload', '.download'].includes(ext)) {
    return { categoryId: 'temp', rule: 'temp', risk: 'safe' }
  }
  return null
}

export function isLogFile(filePath) {
  return ['.log', '.txt', '.etl', '.dmp', '.mdmp', '.trace', '.evtx'].includes(extensionOf(filePath))
}
