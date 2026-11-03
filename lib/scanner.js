import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'

import {
  APPDATA,
  APP_ROOT,
  HOME,
  IS_WINDOWS,
  LOCALLOW,
  LOCALAPPDATA,
  SCAN_VERSION,
  SYSTEM_LOGS,
  SYSTEM_TEMP,
  USER_TEMP,
  browserAppForPath,
  buildCleanupRoots,
  developerCacheRoots,
  isCloudPath,
  isPathInside,
  isProtectedDirName,
  localUserRoots,
  pathKey,
  readVolumeInfo,
} from './safety.js'
import {
  CATEGORY_ORDER,
  KIND_ORDER,
  buildExplanation,
  classifyExtraDriveDirectory,
  extensionOf,
  fileRule,
  isInstallerLike,
  isLogFile,
  isResidualFile,
  kindOfCategory,
  specialDirectoryRule,
} from './explain.js'
import { identifyApp, rawAppNameForPath } from './app-catalog.js'
import { getInstalledApps, isInstalledApplication } from './installed-apps.js'
import { listAvailableDrives, normalizeDriveSelection } from './drives.js'

const DAY_MS = 24 * 60 * 60 * 1000
const LARGE_FILE_BYTES = 150 * 1024 * 1024
const DUPLICATE_MIN_BYTES = 1024 * 1024
const DUPLICATE_MAX_BYTES = 250 * 1024 * 1024
const MAX_HASH_BYTES = 1536 * 1024 * 1024
const MAX_HASH_FILES = 600
const MAX_HASH_GROUPS = 120
const MAX_WARNINGS = 240
const ORPHAN_MIN_AGE_DAYS = 180
const EXTRA_DRIVE_MAX_DEPTH = 4

const MULTI_APP_VENDORS = new Set([
  'microsoft',
  'google',
  'tencent',
  'netease',
  'adobe',
  'nvidia',
  'nvidia corporation',
  'mihoyo',
  'hoyoverse',
  'apple',
  'intel',
  'amd',
  'kingsoft',
  'sogou',
  '360safe',
  '360',
  'baidu',
  'alibaba',
  'bytedance',
  'huawei',
  'xiaomi',
  'electronic arts',
  'ea',
  'ubisoft',
  'riot games',
  'blizzard entertainment',
])

const ORPHAN_SKIP_NAMES = new Set([
  '.dsh',
  '.git',
  'appdata',
  'cache',
  'caches',
  'cachestorage',
  'code cache',
  'crashdumps',
  'd3dscache',
  'data',
  'default',
  'elevateddiagnostics',
  'google',
  'gpucache',
  'indexeddb',
  'local storage',
  'microsoft',
  'opencache',
  'packages',
  'profile',
  'profiles',
  'programs',
  'publishers',
  'service worker',
  'session storage',
  'shadercache',
  'temp',
  'tmp',
  'user data',
  'userdata',
  'virtualstore',
  'webcache',
  'windows',
  'windowsapps',
  'dsh disk cleanup',
  'onedrive',
  'connecteddevicesplatform',
  'comms',
  'placeholdertilelogofolder',
  'apps',
  'assembly',
  'backup',
  'battleye',
  'easyanticheat',
  'anticheatexpert',
  'gameanalytics',
  'speech',
  'publishers',
  'virtualstore',
])

const SAVE_DIR_NAMES = new Set(['save', 'saves', 'savedata', 'saved games', 'savegame', 'savegames', 'saveslot', 'saveslots'])
const SAVE_EXTENSIONS = new Set(['.sav', '.save', '.sl2', '.sl', '.rpgsave', '.rvdata2', '.rxdata', '.srm', '.esv', '.ess', '.fos', '.co2'])
const JUNK_DIR_NAMES = new Set(['cache', 'caches', 'log', 'logs', 'installer', 'installers', 'update', 'updates', 'crashpad', 'temp', 'tmp'])
const JUNK_EXTENSIONS = new Set([
  '.log',
  '.tmp',
  '.temp',
  '.cache',
  '.dmp',
  '.etl',
  '.old',
  '.bak',
  '.trace',
  '.crash',
  '.msi',
  '.msp',
  '.patch',
  '.upd',
  '.7z',
  '.zip',
  '.rar',
])

const MICROSOFT_ORPHAN_SKIP = new Set([
  'windows',
  'crypto',
  'systemcertificates',
  'protect',
  'vault',
  'credentials',
  'windowsapps',
  'windows defender',
  'onedrive',
  'office',
  'edgeupdate',
  'edgecore',
  'teams',
  'visual studio',
  'internet explorer',
])

const EXTRA_DRIVE_SKIP = new Set([
  '$recycle.bin',
  '$dsh-disk-cleanup',
  'system volume information',
  'recovery',
  'config.msi',
  'windows',
  'program files',
  'program files (x86)',
  'programdata',
  'users',
  'documents and settings',
  'node_modules',
  'onedrive',
  'downloads',
  'documents',
  'desktop',
  'pictures',
  'videos',
  'music',
  'wangpan download',
  '迅雷下载',
  '视频导出',
  '录屏',
  '小说、文本内容工作区',
  '番剧',
  '网盘下载',
  '下载',
  '下载文件',
  '百度网盘',
  '阿里云盘',
  '天翼云盘',
  '夸克网盘',
  'gamesavebackup',
  'game save backup',
  'gamesaves',
  'saves',
  '存档',
  '游戏存档',
  'network',
  'local storage',
  'session storage',
  'indexeddb',
  'extensions',
])

const EXTRA_DRIVE_GAME_LIBRARIES = new Set([
  'steamlibrary',
  'steam library',
  'steamapps',
  'epic games',
  'epicgames',
  'gog galaxy',
  'gog games',
  'wegame',
  'games',
  'game',
  'origin games',
  'ea games',
  'ubisoft game launcher',
  'battle.net',
  'blizzard entertainment',
  'riot games',
  '米哈游',
])

const EXTRA_DRIVE_CONTENT_SKIP = new Set([
  'common',
  'workshop',
  'content',
  'movies',
  'sound',
  'audio',
  'textures',
  'paks',
  'binaries',
  'config',
  'save',
  'saves',
  'userdata',
  'backup',
  'backups',
  'gamesavebackup',
  'game save backup',
])

const CACHE_COLLECT_EXCLUDES = new Set([
  'widevinecdm',
  'meipreload',
  'resources',
  'locales',
  'swiftshader',
  'vk_swiftshader',
  'hyphen-data',
  'extensions',
  'native-messaging-hosts',
])

const PROTECTED_DATA_DIRS = new Set([
  '.git',
  '.ssh',
  '.aws',
  '.gnupg',
  '.dsh',
  'indexeddb',
  'local storage',
  'session storage',
  'webstorage',
  'network',
  'extensions',
  'extension state',
  'local extension settings',
  'managed extension settings',
  'extension rules',
  'sync data',
  'sync app settings',
  'platform notifications',
  'segmentation platform',
  'safe browsing',
  'node_modules',
  'packages',
  'windowsapps',
  'onedrive',
  '$recycle.bin',
  '$dsh-disk-cleanup',
  'dsh disk cleanup',
])

const SENSITIVE_FILE_PATTERNS = [
  /^cookies(?:-journal)?$/i,
  /^login data(?:-journal)?$/i,
  /^web data$/i,
  /^history$/i,
  /^bookmarks$/i,
  /^preferences$/i,
  /^local state$/i,
  /^wallet\.dat$/i,
  /\.(?:kdbx|pem|key|pfx|p12)$/i,
  /^\.env(?:\.|$)/i,
]

class ScanAbortedError extends Error {
  constructor() {
    super('扫描已取消')
    this.code = 'SCAN_CANCELLED'
  }
}

function isSensitiveFile(filePath) {
  const name = path.basename(filePath)
  return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(name))
}

function shouldSkipDirectory(name, fullPath) {
  const lower = String(name).toLowerCase()
  if (isProtectedDirName(name)) return true
  if (PROTECTED_DATA_DIRS.has(lower)) return true
  if (isPathInside(APP_ROOT, fullPath)) return true
  if (isCloudPath(fullPath)) return true
  if (lower === 'temp') return true
  return false
}

function shouldSkipTempDirectory(fullPath) {
  if (isPathInside(APP_ROOT, fullPath)) return true
  const activeTemp = process.env.TEMP
  if (activeTemp && isPathInside(activeTemp, fullPath)) return true
  return false
}

function isLockName(name) {
  const lower = name.toLowerCase()
  return lower === 'lock' || lower === 'lockfile' || lower === 'singletonlock' || lower.endsWith('.lock')
}

async function lstatSafe(filePath, state) {
  try {
    return await fs.lstat(filePath)
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) return null
    state.recordWarning(filePath, error)
    return null
  }
}

async function readdirSafe(dirPath, state) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true })
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) return []
    state.recordWarning(dirPath, error)
    return []
  }
}

async function mapLimit(items, limit, worker) {
  let cursor = 0
  const size = Math.max(1, Math.min(limit, items.length || 1))
  const runners = Array.from({ length: size }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      await worker(items[index], index)
    }
  })
  await Promise.all(runners)
}

function buildScanRoots(driveVolumes) {
  const roots = []
  const seen = new Set()
  const add = (root) => {
    const key = pathKey(root.path)
    if (seen.has(key)) return
    seen.add(key)
    roots.push(root)
  }

  const systemVolume = driveVolumes.find((volume) => volume.isSystem)
  if (systemVolume) {
    add({ id: 'user-temp', path: USER_TEMP, label: '用户临时文件', mode: 'temp', requiresAdmin: false })
    add({ id: 'system-temp', path: SYSTEM_TEMP, label: 'Windows 临时文件', mode: 'temp', requiresAdmin: true })
    add({ id: 'system-logs', path: SYSTEM_LOGS, label: 'Windows 日志', mode: 'system-logs', requiresAdmin: true })
    add({ id: 'appdata-local', path: LOCALAPPDATA, label: 'AppData\\Local', mode: 'appdata', requiresAdmin: false })
    add({ id: 'appdata-roaming', path: APPDATA, label: 'AppData\\Roaming', mode: 'appdata', requiresAdmin: false })
    add({ id: 'appdata-locallow', path: LOCALLOW, label: 'AppData\\LocalLow', mode: 'appdata', requiresAdmin: false })
    for (const cache of developerCacheRoots()) {
      add({ id: `dev-${cache.app}-${roots.length}`, path: cache.path, label: cache.app, app: cache.app, mode: 'devcache', requiresAdmin: false })
    }
    for (const userRoot of localUserRoots()) {
      add({ id: `user-${userRoot.label}`, path: userRoot.path, label: userRoot.label, mode: 'user-files', requiresAdmin: false })
    }
  }

  for (const volume of driveVolumes) {
    if (volume.isSystem) continue
    add({
      id: `extra-drive-${volume.letter}`,
      path: volume.root,
      label: `${volume.letter} 常见垃圾位置`,
      mode: 'extra-drive',
      driveRoot: volume.root,
      requiresAdmin: false,
    })
  }
  for (const volume of driveVolumes) {
    add({
      id: `recycle-${volume.letter}`,
      path: path.join(volume.root, '$Recycle.Bin'),
      label: `${volume.letter} 回收站`,
      mode: 'recycle',
      requiresAdmin: false,
    })
  }
  return roots
}

function createState(scanId, options, onProgress) {
  const now = Date.now()
  const state = {
    scanId,
    startedAt: new Date(now).toISOString(),
    startedAtMs: now,
    deadline: now + (options.maxScanMs || 300000),
    options,
    signal: options.signal,
    items: [],
    itemByKey: new Map(),
    itemSeq: 0,
    warnings: [],
    warningCount: 0,
    skipped: { permission: 0, protected: 0, symlink: 0, recent: 0, small: 0, active: 0, error: 0, limit: 0 },
    filesSeen: 0,
    dirsSeen: 0,
    candidateBytes: 0,
    truncated: false,
    partial: false,
    stopReason: null,
    overview: new Map(),
    duplicatePool: [],
    duplicatePoolBytes: 0,
    duplicateGroups: 0,
    hashedBytes: 0,
    hashedFiles: 0,
    userFilesSeen: 0,
    phase: 'preparing',
    currentPath: '',
    lastReportAt: 0,
    onProgress,
    roots: [],
    allowedRoots: new Set(),
    orphanDirs: new Map(),
    orphanApps: [],
    installedApps: null,
    driveVolumes: [],
    extraDriveRoots: [],
  }

  state.recordWarning = (target, error) => {
    state.warningCount += 1
    const code = error?.code || 'ERROR'
    if (code === 'EACCES' || code === 'EPERM') state.skipped.permission += 1
    else state.skipped.error += 1
    if (state.warnings.length < MAX_WARNINGS) {
      state.warnings.push({
        path: String(target),
        code,
        message: error?.message || String(error),
      })
    }
  }

  state.report = (phase, currentPath, force = false) => {
    if (phase) state.phase = phase
    if (currentPath) state.currentPath = currentPath
    const nowMs = Date.now()
    if (!force && nowMs - state.lastReportAt < 500) return
    state.lastReportAt = nowMs
    state.onProgress?.({
      phase: state.phase,
      filesSeen: state.filesSeen,
      dirsSeen: state.dirsSeen,
      candidates: state.items.length,
      candidateBytes: state.candidateBytes,
      currentPath: state.currentPath,
      partial: state.partial,
      stopReason: state.stopReason,
      elapsedMs: nowMs - state.startedAtMs,
    })
  }

  state.check = () => {
    if (state.signal?.aborted) throw new ScanAbortedError()
    if (state.truncated) return false
    if (Date.now() > state.deadline) {
      state.partial = true
      state.stopReason = 'timeout'
      state.truncated = true
      state.skipped.limit += 1
      return false
    }
    return true
  }
  return state
}

function addOverview(state, root, filePath, size) {
  if (!root?.overviewKind) return
  const relative = path.relative(root.path, filePath)
  if (!relative || relative.startsWith('..')) return
  const parts = relative.split(path.sep).filter(Boolean)
  if (parts.length === 0) return
  let label = parts[0]
  let overviewPath = path.join(root.path, parts[0])
  if (label.toLowerCase() === 'microsoft' && parts[1]) {
    label = `Microsoft/${parts[1]}`
    overviewPath = path.join(root.path, parts[0], parts[1])
  }
  const key = `${root.overviewKind}/${label}`
  const existing = state.overview.get(key)
  if (existing) {
    existing.bytes += size
    existing.count += 1
  } else {
    state.overview.set(key, {
      root: root.overviewKind,
      label,
      path: overviewPath,
      bytes: size,
      count: 1,
    })
  }
}

function appNameForPath(filePath, fallback) {
  const browser = browserAppForPath(filePath)
  if (browser) return browser
  const parts = filePath.split(/[\\/]+/).filter(Boolean)
  const lower = parts.map((part) => part.toLowerCase())
  const index = lower.lastIndexOf('appdata')
  if (index >= 0 && index + 2 < parts.length) {
    const area = lower[index + 1]
    if (['local', 'roaming', 'locallow'].includes(area)) {
      let app = parts[index + 2]
      if (app.toLowerCase() === 'microsoft' && parts[index + 3]) app = `Microsoft ${parts[index + 3]}`
      return app.replace(/[-_ ]?updater$/i, '').trim() || fallback
    }
  }
  if (index >= 0 && index + 1 < parts.length) {
    return parts[index + 1].replace(/[-_ ]?updater$/i, '').trim() || fallback
  }
  return fallback || '其他'
}

function sourceRootForPath(state, filePath) {
  let best = ''
  for (const root of state.roots) {
    if (root.mode === 'extra-drive') continue
    if (isPathInside(root.path, filePath) && root.path.length > best.length) best = root.path
  }
  return best || path.dirname(filePath)
}

function addCandidate(state, input) {
  const key = pathKey(input.filePath)
  if (state.itemByKey.has(key)) return false
  if (state.items.length >= (state.options.maxCandidates || 30000)) {
    state.truncated = true
    state.partial = true
    state.stopReason = 'candidate-limit'
    state.skipped.limit += 1
    return false
  }
  const ageDays = Math.max(0, (Date.now() - input.modifiedMs) / DAY_MS)
  const fallback = input.appName || rawAppNameForPath(input.filePath, '其他')
  const appInfo = identifyApp(input.filePath, fallback)
  const sourceRoot = input.sourceRoot || sourceRootForPath(state, input.filePath)
  state.allowedRoots.add(sourceRoot)
  const explanation = buildExplanation({
    categoryId: input.categoryId,
    rule: input.rule,
    filePath: input.filePath,
    size: input.size,
    ageDays,
    appName: appInfo.app,
    appOriginal: appInfo.appOriginal,
    company: input.company || appInfo.company,
    duplicateOf: input.duplicateOf,
    requiresAdmin: input.requiresAdmin,
    orphanReason: input.orphanReason,
    locationNote: input.locationNote,
  })
  const item = {
    id: `item-${state.itemSeq + 1}`,
    categoryId: input.categoryId,
    kind: kindOfCategory(input.categoryId),
    groupId: `${input.categoryId}::${appInfo.appKey || appInfo.app}`,
    app: appInfo.app,
    appOriginal: appInfo.appOriginal,
    company: input.company || appInfo.company,
    path: input.filePath,
    name: path.basename(input.filePath),
    extension: extensionOf(input.filePath),
    size: input.size,
    modifiedMs: input.modifiedMs,
    ageDays: Math.round(ageDays * 10) / 10,
    risk: input.risk || 'safe',
    protected: Boolean(input.protected),
    cleanable: explanation.cleanable,
    defaultSelected: false,
    requiresAdmin: Boolean(input.requiresAdmin),
    purpose: explanation.purpose,
    reason: explanation.reason,
    sourceRoot,
    orphanReason: input.orphanReason || null,
    duplicateOf: input.duplicateOf || null,
  }
  state.itemSeq += 1
  state.items.push(item)
  state.itemByKey.set(key, item)
  state.candidateBytes += input.size
  return true
}

function removeCandidate(state, filePath) {
  const key = pathKey(filePath)
  const item = state.itemByKey.get(key)
  if (!item) return
  state.itemByKey.delete(key)
  const index = state.items.indexOf(item)
  if (index >= 0) state.items.splice(index, 1)
  state.candidateBytes -= item.size
}

async function collectDirectoryFiles(state, root, dirPath, rule, options = {}) {
  if (!state.check()) return
  state.dirsSeen += 1
  const entries = await readdirSafe(dirPath, state)
  state.report(rule.categoryId === 'update' ? 'update' : state.phase, dirPath)
  const files = entries.filter((entry) => entry.isFile() || entry.isSymbolicLink())
  await mapLimit(files, 24, async (entry) => {
    if (!state.check()) return
    const fullPath = path.join(dirPath, entry.name)
    state.filesSeen += 1
    if (entry.isSymbolicLink()) {
      state.skipped.symlink += 1
      return
    }
    if (isLockName(entry.name)) {
      state.skipped.protected += 1
      return
    }
    const stat = await lstatSafe(fullPath, state)
    if (!stat || !stat.isFile()) return
    addOverview(state, root, fullPath, stat.size)
    if (stat.size < 1024) {
      state.skipped.small += 1
      return
    }
    if (isSensitiveFile(fullPath)) {
      state.skipped.protected += 1
      return
    }
    if (options.logsOnly && !isLogFile(fullPath)) {
      state.skipped.protected += 1
      return
    }
    if (options.installerOnly && !isInstallerLike(fullPath, stat.size)) {
      state.skipped.protected += 1
      return
    }
    const ageDays = (Date.now() - stat.mtimeMs) / DAY_MS
    if (optionMinAge(options) > 0 && ageDays < optionMinAge(options)) {
      state.skipped.recent += 1
      return
    }
    if (options.rule === 'browser-sw' && isLockName(entry.name)) return
    const orphan = options.orphan || null
    addCandidate(state, {
      categoryId: orphan ? 'uninstall' : rule.categoryId,
      rule: orphan ? 'uninstall' : (options.ruleOverride || rule.rule),
      filePath: fullPath,
      size: stat.size,
      modifiedMs: stat.mtimeMs,
      risk: orphan ? 'review' : (options.risk || rule.risk || 'safe'),
      protected: orphan ? true : Boolean(options.protected),
      requiresAdmin: Boolean(options.requiresAdmin || root.requiresAdmin),
      appName: orphan?.app || options.appName || appNameForPath(fullPath, root.label),
      appOriginal: orphan?.appOriginal,
      company: orphan?.company,
      orphanReason: orphan?.reason,
      sourceRoot: orphan?.path || options.sourceRoot || root.path,
      locationNote: options.locationNote,
      duplicateOf: options.duplicateOf,
    })
  })
  const dirs = entries.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
  for (const entry of dirs) {
    if (!state.check()) return
    const fullPath = path.join(dirPath, entry.name)
    if (CACHE_COLLECT_EXCLUDES.has(String(entry.name).toLowerCase())) {
      state.skipped.protected += 1
      continue
    }
    if (shouldSkipDirectory(entry.name, fullPath)) {
      state.skipped.protected += 1
      continue
    }
    await collectDirectoryFiles(state, root, fullPath, rule, options)
  }
}

function optionMinAge(options) {
  return Number.isFinite(options?.minAgeDays) ? options.minAgeDays : 0
}

async function walkTempRoot(state, root) {
  if (!state.check()) return
  state.phase = 'temp'
  await walkTempDir(state, root, root.path)
}

async function walkTempDir(state, root, dirPath) {
  if (!state.check()) return
  state.dirsSeen += 1
  const entries = await readdirSafe(dirPath, state)
  state.report('temp', dirPath)
  const files = entries.filter((entry) => entry.isFile() || entry.isSymbolicLink())
  await mapLimit(files, 24, async (entry) => {
    if (!state.check()) return
    const fullPath = path.join(dirPath, entry.name)
    state.filesSeen += 1
    if (entry.isSymbolicLink()) {
      state.skipped.symlink += 1
      return
    }
    const stat = await lstatSafe(fullPath, state)
    if (!stat || !stat.isFile()) return
    if (stat.size < 1024) {
      state.skipped.small += 1
      return
    }
    if (isSensitiveFile(fullPath)) {
      state.skipped.protected += 1
      return
    }
    const ageDays = (Date.now() - stat.mtimeMs) / DAY_MS
    if (ageDays < state.options.minAgeDays) {
      state.skipped.recent += 1
      return
    }
    const relative = path.relative(root.path, fullPath)
    const group = relative.split(path.sep)[0] || root.label
    addCandidate(state, {
      categoryId: 'temp',
      rule: 'temp',
      filePath: fullPath,
      size: stat.size,
      modifiedMs: stat.mtimeMs,
      risk: root.requiresAdmin ? 'caution' : 'safe',
      protected: false,
      requiresAdmin: Boolean(root.requiresAdmin),
      appName: root.requiresAdmin ? 'Windows' : (group === path.basename(fullPath) ? root.label : group),
    })
  })
  const dirs = entries.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
  for (const entry of dirs) {
    if (!state.check()) return
    const fullPath = path.join(dirPath, entry.name)
    if (shouldSkipTempDirectory(fullPath) || shouldSkipDirectory(entry.name, fullPath)) {
      state.skipped.active += 1
      continue
    }
    await walkTempDir(state, root, fullPath)
  }
}

async function walkSystemLogs(state, root) {
  if (!state.check()) return
  state.phase = 'system'
  const walk = async (dirPath) => {
    if (!state.check()) return
    state.dirsSeen += 1
    const entries = await readdirSafe(dirPath, state)
    state.report('system', dirPath)
    const files = entries.filter((entry) => entry.isFile())
    await mapLimit(files, 20, async (entry) => {
      if (!state.check()) return
      const fullPath = path.join(dirPath, entry.name)
      state.filesSeen += 1
      if (!isLogFile(fullPath)) {
        state.skipped.protected += 1
        return
      }
      const stat = await lstatSafe(fullPath, state)
      if (!stat || !stat.isFile()) return
      if (stat.size < 1024) {
        state.skipped.small += 1
        return
      }
      addCandidate(state, {
        categoryId: 'logs',
        rule: 'system-log',
        filePath: fullPath,
        size: stat.size,
        modifiedMs: stat.mtimeMs,
        risk: 'caution',
        protected: false,
        requiresAdmin: true,
        appName: 'Windows',
      })
    })
    const dirs = entries.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    for (const entry of dirs) {
      if (!state.check()) return
      const fullPath = path.join(dirPath, entry.name)
      if (shouldSkipDirectory(entry.name, fullPath)) {
        state.skipped.protected += 1
        continue
      }
      await walk(fullPath)
    }
  }
  await walk(root.path)
}

async function walkAppDataRoot(state, root) {
  if (!state.check()) return
  state.phase = 'appdata'
  root.overviewKind = root.id === 'appdata-local' ? 'Local' : root.id === 'appdata-roaming' ? 'Roaming' : 'LocalLow'
  await walkAppDataDir(state, root, root.path, 0)
}

async function detectOrphanAppDataDirs(state) {
  if (!state.installedApps?.available) return
  const roots = [LOCALAPPDATA, APPDATA, LOCALLOW]
  for (const rootPath of roots) {
    if (!state.check()) return
    const entries = await readdirSafe(rootPath, state)
    const dirs = entries.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    for (const entry of dirs) {
      if (!state.check()) return
      const lower = entry.name.toLowerCase()
      if (ORPHAN_SKIP_NAMES.has(lower) || isProtectedDirName(entry.name) || isCloudPath(path.join(rootPath, entry.name))) {
        continue
      }
      const fullPath = path.join(rootPath, entry.name)
      if (MULTI_APP_VENDORS.has(lower)) {
        const children = await readdirSafe(fullPath, state)
        for (const child of children) {
          if (!state.check()) return
          if (!child.isDirectory() || child.isSymbolicLink()) continue
          if (lower === 'microsoft' && MICROSOFT_ORPHAN_SKIP.has(child.name.toLowerCase())) continue
          await considerOrphanDir(state, path.join(fullPath, child.name), child.name, entry.name)
        }
        continue
      }
      await considerOrphanDir(state, fullPath, entry.name, '')
    }
  }
}

async function inspectOrphanDir(state, dirPath, cutoffMs, budget = 700) {
  const result = { recent: false, junk: false, save: false }
  const stack = [{ path: dirPath, depth: 0 }]
  let seen = 0
  while (stack.length > 0 && seen < budget) {
    if (!state.check()) return { ...result, recent: true }
    const current = stack.pop()
    const entries = await readdirSafe(current.path, state)
    for (const entry of entries) {
      if (seen >= budget) break
      if (entry.isSymbolicLink()) continue
      const fullPath = path.join(current.path, entry.name)
      const stat = await lstatSafe(fullPath, state)
      if (!stat) continue
      seen += 1
      if (stat.mtimeMs > cutoffMs) result.recent = true
      if (stat.isDirectory()) {
        const name = entry.name.toLowerCase()
        if (SAVE_DIR_NAMES.has(name)) result.save = true
        if (JUNK_DIR_NAMES.has(name)) result.junk = true
        if (current.depth < 3) stack.push({ path: fullPath, depth: current.depth + 1 })
        continue
      }
      const extension = path.extname(entry.name).toLowerCase()
      if (SAVE_EXTENSIONS.has(extension)) result.save = true
      if (JUNK_EXTENSIONS.has(extension)) result.junk = true
    }
  }
  return result
}

async function considerOrphanDir(state, dirPath, name, parentName) {
  const lower = name.toLowerCase()
  if (ORPHAN_SKIP_NAMES.has(lower) || isProtectedDirName(name) || isCloudPath(dirPath)) return
  const stat = await lstatSafe(dirPath, state)
  if (!stat || !stat.isDirectory() || stat.isSymbolicLink()) return
  const ageDays = (Date.now() - stat.mtimeMs) / DAY_MS
  if (ageDays < ORPHAN_MIN_AGE_DAYS) return
  const installed = isInstalledApplication(name, parentName, state.installedApps)
  if (installed !== false) return
  const inspection = await inspectOrphanDir(state, dirPath, Date.now() - ORPHAN_MIN_AGE_DAYS * DAY_MS)
  if (inspection.recent) return
  // Only report application-data folders that still contain cache, log,
  // installer, or update material. A pure save-data folder is user data, not
  // uninstall residue, so it must never be classified as such.
  if (inspection.save) return
  if (!inspection.junk) return
  const identity = identifyApp(dirPath, parentName ? `${parentName} ${name}` : name)
  const reason = `目录最后修改于 ${new Date(stat.mtimeMs).toLocaleDateString('zh-CN')}，已超过 ${ORPHAN_MIN_AGE_DAYS} 天没有更新；系统已安装程序登记中没有匹配到 ${parentName ? `${parentName} / ` : ''}${name}；目录内仍留有缓存、日志、安装包或更新文件。`
  const orphan = {
    path: dirPath,
    name,
    parentName,
    app: identity.app,
    appOriginal: identity.appOriginal,
    company: identity.company,
    reason,
  }
  state.orphanDirs.set(pathKey(dirPath), orphan)
  if (state.orphanApps.length < 200) state.orphanApps.push(orphan)
}

async function walkAppDataDir(state, root, dirPath, depth, orphanApp = null) {
  if (!state.check()) return
  state.dirsSeen += 1
  const orphan = orphanApp || state.orphanDirs.get(pathKey(dirPath)) || null
  const entries = await readdirSafe(dirPath, state)
  state.report('appdata', dirPath)
  const files = entries.filter((entry) => entry.isFile() || entry.isSymbolicLink())
  await mapLimit(files, 24, async (entry) => {
    if (!state.check()) return
    const fullPath = path.join(dirPath, entry.name)
    state.filesSeen += 1
    if (entry.isSymbolicLink()) {
      state.skipped.symlink += 1
      return
    }
    const stat = await lstatSafe(fullPath, state)
    if (!stat || !stat.isFile()) return
    addOverview(state, root, fullPath, stat.size)
    if (stat.size < 1024) {
      state.skipped.small += 1
      return
    }
    if (isSensitiveFile(fullPath)) {
      state.skipped.protected += 1
      return
    }
    if (orphan) {
      if (!isResidualFile(fullPath, stat.size)) return
      addCandidate(state, {
        categoryId: 'uninstall',
        rule: 'uninstall',
        filePath: fullPath,
        size: stat.size,
        modifiedMs: stat.mtimeMs,
        risk: 'review',
        protected: true,
        requiresAdmin: false,
        appName: orphan.app,
        sourceRoot: orphan.path,
        orphanReason: orphan.reason,
      })
      return
    }
    const ageDays = (Date.now() - stat.mtimeMs) / DAY_MS
    const browserApp = browserAppForPath(fullPath)
    const rule = fileRule(fullPath, stat.size, ageDays, browserApp)
    if (!rule) return
    addCandidate(state, {
      categoryId: rule.categoryId,
      rule: rule.rule,
      filePath: fullPath,
      size: stat.size,
      modifiedMs: stat.mtimeMs,
      risk: rule.risk || 'safe',
      protected: false,
      requiresAdmin: false,
      appName: appNameForPath(fullPath, root.label),
      sourceRoot: root.path,
    })
  })
  const dirs = entries.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
  for (const entry of dirs) {
    if (!state.check()) return
    const fullPath = path.join(dirPath, entry.name)
    if (orphan && SAVE_DIR_NAMES.has(entry.name.toLowerCase())) {
      state.skipped.protected += 1
      continue
    }
    if (shouldSkipDirectory(entry.name, fullPath)) {
      state.skipped.protected += 1
      continue
    }
    const browserApp = browserAppForPath(fullPath)
    const special = specialDirectoryRule(entry.name, fullPath, browserApp)
    if (special) {
      const options = {
        appName: orphan?.app || appNameForPath(fullPath, root.label),
        sourceRoot: orphan?.path || root.path,
        orphan,
      }
      if (special.type === 'cache') {
        await collectDirectoryFiles(state, root, fullPath, special, options)
      } else if (special.type === 'crash') {
        await collectDirectoryFiles(state, root, fullPath, special, options)
      } else if (special.type === 'updater') {
        await collectDirectoryFiles(state, root, fullPath, special, {
          ...options,
          installerOnly: true,
        })
      } else if (special.type === 'logs') {
        await collectDirectoryFiles(state, root, fullPath, special, {
          ...options,
          logsOnly: true,
        })
      }
      continue
    }
    await walkAppDataDir(state, root, fullPath, depth + 1, orphan)
  }
}

async function walkDevCacheRoot(state, root) {
  if (!state.check()) return
  state.phase = 'devcache'
  const exists = await lstatSafe(root.path, state)
  if (!exists || !exists.isDirectory()) return
  await collectDirectoryFiles(state, root, root.path, {
    type: 'cache',
    categoryId: 'devcache',
    rule: 'devcache',
    risk: 'caution',
  }, {
    appName: root.app || root.label,
    skipOverview: true,
  })
}

async function walkUserRoot(state, root) {
  if (!state.check()) return
  state.phase = 'user-files'
  const info = await lstatSafe(root.path, state)
  if (!info || !info.isDirectory()) return
  if (info.isSymbolicLink() || isCloudPath(root.path)) {
    state.skipped.symlink += 1
    return
  }
  await walkUserDir(state, root, root.path, 0)
}

async function walkUserDir(state, root, dirPath, depth) {
  if (!state.check()) return
  if (depth > 12) return
  state.dirsSeen += 1
  const entries = await readdirSafe(dirPath, state)
  state.report('user-files', dirPath)
  const files = entries.filter((entry) => entry.isFile())
  await mapLimit(files, 16, async (entry) => {
    if (!state.check()) return
    const fullPath = path.join(dirPath, entry.name)
    state.filesSeen += 1
    state.userFilesSeen += 1
    const stat = await lstatSafe(fullPath, state)
    if (!stat || !stat.isFile()) return
    if (isCloudPath(fullPath)) return
    if (isSensitiveFile(fullPath)) {
      state.skipped.protected += 1
      return
    }
    if (stat.size >= LARGE_FILE_BYTES) {
      addCandidate(state, {
        categoryId: 'large',
        rule: 'large',
        filePath: fullPath,
        size: stat.size,
        modifiedMs: stat.mtimeMs,
        risk: 'review',
        protected: true,
        requiresAdmin: false,
        appName: root.label,
      })
    }
    if (
      stat.size >= DUPLICATE_MIN_BYTES &&
      stat.size <= DUPLICATE_MAX_BYTES &&
      state.duplicatePool.length < 4000 &&
      state.duplicatePoolBytes < 4096 * 1024 * 1024
    ) {
      state.duplicatePool.push({
        path: fullPath,
        size: stat.size,
        modifiedMs: stat.mtimeMs,
        rootLabel: root.label,
      })
      state.duplicatePoolBytes += stat.size
    }
  })
  const dirs = entries.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
  for (const entry of dirs) {
    if (!state.check()) return
    const fullPath = path.join(dirPath, entry.name)
    if (shouldSkipDirectory(entry.name, fullPath)) {
      state.skipped.protected += 1
      continue
    }
    await walkUserDir(state, root, fullPath, depth + 1)
  }
}

function extraDriveLocationNote(root) {
  const drive = root.driveRoot || path.parse(root.path).root
  return `该文件位于非系统盘 ${drive}；本次只扫描了常见缓存、日志、临时和残留目录，没有遍历用户文档和游戏内容。`
}

function shouldSkipExtraDirectory(name, fullPath) {
  const lower = String(name).toLowerCase()
  if (!lower || isProtectedDirName(name) || isCloudPath(fullPath)) return true
  if (EXTRA_DRIVE_SKIP.has(lower) || EXTRA_DRIVE_CONTENT_SKIP.has(lower)) return true
  return false
}

async function collectExtraClassifiedDir(state, root, dirPath, classification) {
  const base = path.basename(dirPath)
  const common = {
    appName: base,
    sourceRoot: dirPath,
    locationNote: extraDriveLocationNote(root),
    requiresAdmin: Boolean(classification.requiresAdmin),
  }
  if (classification.categoryId === 'uninstall') {
    const identity = identifyApp(dirPath, base)
    const orphan = {
      path: dirPath,
      app: identity.app,
      appOriginal: identity.appOriginal,
      company: identity.company,
      reason: '目录名表明这里可能是卸载残留或旧版本备份；请确认不是用户自己保留的备份。',
    }
    await collectDirectoryFiles(state, root, dirPath, classification, { ...common, orphan, minAgeDays: 0 })
    return
  }
  if (classification.rule === 'system-leftover') {
    await collectDirectoryFiles(state, root, dirPath, classification, {
      ...common,
      requiresAdmin: true,
      protected: true,
      minAgeDays: 0,
    })
    return
  }
  if (classification.categoryId === 'logs') {
    await collectDirectoryFiles(state, root, dirPath, classification, { ...common, logsOnly: true, minAgeDays: 2 })
    return
  }
  if (classification.categoryId === 'temp' || classification.rule === 'updater') {
    await collectDirectoryFiles(state, root, dirPath, classification, { ...common, minAgeDays: 2 })
    return
  }
  await collectDirectoryFiles(state, root, dirPath, classification, { ...common, minAgeDays: 0 })
}

async function walkExtraRootFiles(state, root) {
  const entries = await readdirSafe(root.path, state)
  const files = entries.filter((entry) => entry.isFile() || entry.isSymbolicLink())
  await mapLimit(files, 16, async (entry) => {
    if (!state.check()) return
    if (entry.isSymbolicLink()) {
      state.skipped.symlink += 1
      return
    }
    const fullPath = path.join(root.path, entry.name)
    const stat = await lstatSafe(fullPath, state)
    if (!stat || !stat.isFile() || stat.size < 1024) return
    state.filesSeen += 1
    if (isSensitiveFile(fullPath)) {
      state.skipped.protected += 1
      return
    }
    const ageDays = (Date.now() - stat.mtimeMs) / DAY_MS
    if (ageDays < state.options.minAgeDays) {
      state.skipped.recent += 1
      return
    }
    const ext = extensionOf(fullPath)
    let classification = null
    let orphanReason = null
    if (['.log', '.etl', '.trace'].includes(ext)) {
      classification = { categoryId: 'logs', rule: 'log', risk: 'caution', requiresAdmin: false }
    } else if (['.dmp', '.mdmp', '.hdmp'].includes(ext)) {
      classification = { categoryId: 'logs', rule: 'crash', risk: 'caution', requiresAdmin: false }
    } else if (['.tmp', '.partial', '.crdownload', '.download'].includes(ext)) {
      classification = { categoryId: 'temp', rule: 'temp', risk: 'caution', requiresAdmin: false }
    } else if (['.old', '.bak'].includes(ext)) {
      classification = { categoryId: 'uninstall', rule: 'uninstall', risk: 'review', requiresAdmin: false }
      orphanReason = '这是位于非系统盘根目录的旧版本或备份文件，请确认不是用户自己保留的备份。'
    }
    if (!classification) return
    addCandidate(state, {
      categoryId: classification.categoryId,
      rule: classification.rule,
      filePath: fullPath,
      size: stat.size,
      modifiedMs: stat.mtimeMs,
      risk: classification.risk,
      protected: classification.categoryId === 'uninstall',
      requiresAdmin: false,
      appName: rawAppNameForPath(fullPath, '非系统盘文件'),
      sourceRoot: fullPath,
      orphanReason,
      locationNote: extraDriveLocationNote(root),
    })
  })
}

async function walkExtraSteamLibrary(state, root, dirPath) {
  const steamapps = path.join(dirPath, 'steamapps')
  const entries = await readdirSafe(steamapps, state)
  for (const entry of entries) {
    if (!state.check()) return
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue
    const lower = entry.name.toLowerCase()
    if (!['downloading', 'temp', 'shadercache', 'depotcache'].includes(lower)) continue
    const fullPath = path.join(steamapps, entry.name)
    const classification = classifyExtraDriveDirectory(entry.name, fullPath)
    if (classification) await collectExtraClassifiedDir(state, root, fullPath, classification)
  }
}

async function walkExtraChildren(state, root, dirPath, depth) {
  if (!state.check() || depth > EXTRA_DRIVE_MAX_DEPTH) return
  const entries = await readdirSafe(dirPath, state)
  const dirs = entries.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
  for (const entry of dirs) {
    if (!state.check()) return
    const fullPath = path.join(dirPath, entry.name)
    const lower = entry.name.toLowerCase()
    if (shouldSkipExtraDirectory(entry.name, fullPath)) continue
    if (lower === 'steamlibrary' || lower === 'steam library' || lower === 'steamapps') {
      await walkExtraSteamLibrary(state, root, lower === 'steamapps' ? path.dirname(fullPath) : fullPath)
      continue
    }
    if (EXTRA_DRIVE_GAME_LIBRARIES.has(lower)) continue
    const classification = classifyExtraDriveDirectory(entry.name, fullPath)
    if (classification) {
      await collectExtraClassifiedDir(state, root, fullPath, classification)
      continue
    }
    await walkExtraChildren(state, root, fullPath, depth + 1)
  }
}

async function walkExtraDrive(state, root) {
  if (!state.check()) return
  state.phase = 'extra-drive'
  state.extraDriveRoots.push(root.driveRoot || path.parse(root.path).root)
  await walkExtraRootFiles(state, root)
  const entries = await readdirSafe(root.path, state)
  const dirs = entries.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
  for (const entry of dirs) {
    if (!state.check()) return
    const lower = entry.name.toLowerCase()
    const fullPath = path.join(root.path, entry.name)
    if (lower === '$recycle.bin' || lower === '$dsh-disk-cleanup') continue
    const classification = classifyExtraDriveDirectory(entry.name, fullPath)
    if (classification) {
      await collectExtraClassifiedDir(state, root, fullPath, classification)
      continue
    }
    if (lower === 'steamlibrary' || lower === 'steam library' || lower === 'steamapps') {
      await walkExtraSteamLibrary(state, root, lower === 'steamapps' ? root.path : fullPath)
      continue
    }
    if (shouldSkipExtraDirectory(entry.name, fullPath)) continue
    if (EXTRA_DRIVE_GAME_LIBRARIES.has(lower)) continue
    await walkExtraChildren(state, root, fullPath, 1)
  }
}

async function walkRecycleBin(state, root) {
  if (!state.check()) return
  state.phase = 'recycle'
  const info = await lstatSafe(root.path, state)
  if (!info || !info.isDirectory()) return
  let seen = 0
  const walk = async (dirPath) => {
    if (!state.check() || seen > 5000) return
    state.dirsSeen += 1
    const entries = await readdirSafe(dirPath, state)
    state.report('recycle', dirPath)
    const files = entries.filter((entry) => entry.isFile())
    await mapLimit(files, 16, async (entry) => {
      if (!state.check() || seen > 5000) return
      if (!entry.name.startsWith('$R')) return
      const fullPath = path.join(dirPath, entry.name)
      state.filesSeen += 1
      seen += 1
      const stat = await lstatSafe(fullPath, state)
      if (!stat || !stat.isFile() || stat.size < 1024) return
      addCandidate(state, {
        categoryId: 'recycle',
        rule: 'recycle',
        filePath: fullPath,
        size: stat.size,
        modifiedMs: stat.mtimeMs,
        risk: 'review',
        protected: true,
        requiresAdmin: false,
        appName: 'Windows 回收站',
      })
    })
    const dirs = entries.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    for (const entry of dirs) {
      if (seen > 5000) return
      await walk(path.join(dirPath, entry.name))
    }
  }
  await walk(root.path)
}

async function hashFile(filePath, signal) {
  const hash = createHash('sha256')
  const stream = createReadStream(filePath, { highWaterMark: 1024 * 1024 })
  try {
    for await (const chunk of stream) {
      if (signal?.aborted) throw new ScanAbortedError()
      hash.update(chunk)
    }
    return hash.digest('hex')
  } finally {
    stream.destroy()
  }
}

async function analyzeDuplicates(state) {
  if (!state.options.deep) return
  if (!state.check()) return
  state.phase = 'duplicates'
  state.report('duplicates', '', true)
  const groups = new Map()
  for (const entry of state.duplicatePool) {
    if (!groups.has(entry.size)) groups.set(entry.size, [])
    groups.get(entry.size).push(entry)
  }
  const candidates = [...groups.entries()]
    .filter(([, entries]) => entries.length >= 2)
    .map(([size, entries]) => ({ size, entries, waste: size * (entries.length - 1) }))
    .sort((left, right) => right.waste - left.waste)

  let groupsChecked = 0
  for (const group of candidates) {
    if (!state.check()) return
    if (groupsChecked >= MAX_HASH_GROUPS) break
    if (state.hashedFiles + group.entries.length > MAX_HASH_FILES) break
    if (state.hashedBytes + group.size * group.entries.length > MAX_HASH_BYTES) break
    const usable = group.entries.slice(0, 8)
    if (usable.length < 2) continue
    groupsChecked += 1
    const hashes = []
    for (const entry of usable) {
      if (!state.check()) return
      try {
        const digest = await hashFile(entry.path, state.signal)
        hashes.push({ ...entry, digest })
        state.hashedBytes += entry.size
        state.hashedFiles += 1
      } catch (error) {
        if (error?.code === 'SCAN_CANCELLED') throw error
        state.recordWarning(entry.path, error)
      }
    }
    const byDigest = new Map()
    for (const entry of hashes) {
      if (!byDigest.has(entry.digest)) byDigest.set(entry.digest, [])
      byDigest.get(entry.digest).push(entry)
    }
    for (const same of byDigest.values()) {
      if (same.length < 2) continue
      same.sort((left, right) => right.modifiedMs - left.modifiedMs || left.path.length - right.path.length)
      const keeper = same[0]
      for (const entry of same.slice(1)) {
        removeCandidate(state, entry.path)
        const added = addCandidate(state, {
          categoryId: 'duplicate',
          rule: 'duplicate',
          filePath: entry.path,
          size: entry.size,
          modifiedMs: entry.modifiedMs,
          risk: 'review',
          protected: true,
          requiresAdmin: false,
          appName: '重复文件',
          duplicateOf: keeper.path,
        })
        if (added) state.duplicateGroups += 1
      }
    }
    state.report('duplicates', keeperPathOf(group), true)
  }
}

function keeperPathOf(group) {
  return group.entries[0]?.path || ''
}

function buildSnapshot(state) {
  const items = [...state.items]
  const categoryRank = new Map(CATEGORY_ORDER.map((id, index) => [id, index]))
  items.sort((left, right) => {
    const category = (categoryRank.get(left.categoryId) ?? 99) - (categoryRank.get(right.categoryId) ?? 99)
    if (category !== 0) return category
    const app = left.app.localeCompare(right.app, 'zh-CN')
    if (app !== 0) return app
    return right.size - left.size
  })

  const categories = []
  const categoryMap = new Map()
  const groupMap = new Map()
  for (const item of items) {
    if (!item.groupId) item.groupId = `${item.categoryId}::${item.app}`
    let category = categoryMap.get(item.categoryId)
    if (!category) {
      category = { id: item.categoryId, count: 0, bytes: 0 }
      categoryMap.set(item.categoryId, category)
      categories.push(category)
    }
    category.count += 1
    category.bytes += item.size
    let group = groupMap.get(item.groupId)
    if (!group) {
      group = {
        id: item.groupId,
        categoryId: item.categoryId,
        app: item.app,
        count: 0,
        bytes: 0,
        safe: 0,
        caution: 0,
        review: 0,
        cleanable: 0,
      }
      groupMap.set(item.groupId, group)
    }
    group.count += 1
    group.bytes += item.size
    group[item.risk] += 1
    if (item.cleanable) group.cleanable += 1
  }
  categories.sort((left, right) => (categoryRank.get(left.id) ?? 99) - (categoryRank.get(right.id) ?? 99))
  const groups = [...groupMap.values()].sort((left, right) => {
    const rank = (categoryRank.get(left.categoryId) ?? 99) - (categoryRank.get(right.categoryId) ?? 99)
    return rank !== 0 ? rank : right.bytes - left.bytes
  })

  const totals = {
    count: items.length,
    bytes: items.reduce((sum, item) => sum + item.size, 0),
    safeBytes: items.filter((item) => item.risk === 'safe').reduce((sum, item) => sum + item.size, 0),
    cautionBytes: items.filter((item) => item.risk === 'caution').reduce((sum, item) => sum + item.size, 0),
    reviewBytes: items.filter((item) => item.risk === 'review').reduce((sum, item) => sum + item.size, 0),
    cleanableCount: items.filter((item) => item.cleanable).length,
    cleanableBytes: items.filter((item) => item.cleanable).reduce((sum, item) => sum + item.size, 0),
  }

  const kindMap = new Map()
  for (const item of items) {
    const kind = item.kind || kindOfCategory(item.categoryId)
    let entry = kindMap.get(kind)
    if (!entry) {
      entry = { id: kind, count: 0, bytes: 0 }
      kindMap.set(kind, entry)
    }
    entry.count += 1
    entry.bytes += item.size
  }
  const kindRank = new Map(KIND_ORDER.map((id, index) => [id, index]))
  const kinds = [...kindMap.values()].sort((left, right) => (kindRank.get(left.id) ?? 99) - (kindRank.get(right.id) ?? 99))

  const overview = [...state.overview.values()]
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, 18)

  return {
    version: SCAN_VERSION,
    scanId: state.scanId,
    status: 'done',
    startedAt: state.startedAt,
    finishedAt: new Date().toISOString(),
    elapsedMs: Date.now() - state.startedAtMs,
    platform: process.platform,
    volume: state.volume || null,
    drives: state.driveVolumes,
    roots: state.roots,
    allowedRoots: [...state.allowedRoots],
    items,
    categories,
    groups,
    kinds,
    totals,
    appDataOverview: overview,
    orphanApps: state.orphanApps,
    installedAppIndex: {
      available: Boolean(state.installedApps?.available),
      count: state.installedApps?.apps?.length || 0,
      errorCount: state.installedApps?.errors?.length || 0,
    },
    extraDriveRoots: state.extraDriveRoots,
    warnings: state.warnings,
    warningCount: state.warningCount,
    skipped: state.skipped,
    coverage: {
      deep: Boolean(state.options.deep),
      duplicateGroups: state.duplicateGroups,
      hashedBytes: state.hashedBytes,
      hashedFiles: state.hashedFiles,
      userFilesSeen: state.userFilesSeen,
      filesSeen: state.filesSeen,
      dirsSeen: state.dirsSeen,
      partial: state.partial,
      stopReason: state.stopReason,
      truncated: state.truncated,
      maxCandidates: state.options.maxCandidates,
      drives: state.driveVolumes.map((drive) => drive.letter),
      orphanApps: state.orphanApps.length,
      installedAppsAvailable: Boolean(state.installedApps?.available),
    },
    limits: {
      maxScanMs: state.options.maxScanMs,
      maxCandidates: state.options.maxCandidates,
      maxHashBytes: MAX_HASH_BYTES,
    },
  }
}

export async function scanDisk(options = {}) {
  const scanId = options.scanId || `scan-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`
  const settings = {
    deep: options.deep !== false,
    minAgeDays: Number.isFinite(options.minAgeDays) ? Math.max(0.25, options.minAgeDays) : 2,
    maxScanMs: Number.isFinite(options.maxScanMs) ? Math.max(10000, options.maxScanMs) : 300000,
    maxCandidates: Number.isFinite(options.maxCandidates) ? Math.max(1000, options.maxCandidates) : 30000,
    signal: options.signal,
  }
  const state = createState(scanId, settings, options.onProgress)
  const selection = await normalizeDriveSelection(options.drives)
  if (selection.drives.length === 0) {
    const error = new Error('没有可扫描的磁盘')
    error.code = 'NO_DRIVE'
    throw error
  }
  state.driveVolumes = selection.drives.map((drive) => ({ ...drive }))
  state.volume = state.driveVolumes.find((drive) => drive.isSystem) || state.driveVolumes[0]
  state.allowedRoots = new Set(buildCleanupRoots())
  state.report('preparing', '', true)

  if (state.driveVolumes.some((drive) => drive.isSystem)) {
    state.installedApps = await getInstalledApps()
    if (state.installedApps.available) await detectOrphanAppDataDirs(state)
    state.report('preparing', '', true)
  }

  const roots = buildScanRoots(state.driveVolumes)
  state.roots = roots.map((root) => ({
    id: root.id,
    path: root.path,
    label: root.label,
    mode: root.mode,
    driveRoot: root.driveRoot || null,
    requiresAdmin: Boolean(root.requiresAdmin),
  }))

  try {
    for (const root of roots) {
      if (!state.check()) break
      if (root.mode === 'appdata') {
        const exists = await lstatSafe(root.path, state)
        if (!exists || !exists.isDirectory()) continue
        await walkAppDataRoot(state, root)
      } else if (root.mode === 'temp') {
        const exists = await lstatSafe(root.path, state)
        if (!exists || !exists.isDirectory()) continue
        await walkTempRoot(state, root)
      } else if (root.mode === 'system-logs') {
        const exists = await lstatSafe(root.path, state)
        if (!exists || !exists.isDirectory()) continue
        await walkSystemLogs(state, root)
      } else if (root.mode === 'devcache') {
        await walkDevCacheRoot(state, root)
      } else if (root.mode === 'user-files') {
        await walkUserRoot(state, root)
      } else if (root.mode === 'extra-drive') {
        await walkExtraDrive(state, root)
      } else if (root.mode === 'recycle') {
        await walkRecycleBin(state, root)
      }
    }
    if (state.check()) await analyzeDuplicates(state)
    state.phase = 'finalizing'
    state.report('finalizing', '', true)
    for (const drive of state.driveVolumes) {
      const after = await readVolumeInfo(drive.root)
      drive.freeAfter = after.free
      drive.usedAfter = after.used
      drive.percentUsedAfter = after.percentUsed
    }
    state.volume = state.driveVolumes.find((drive) => drive.root === state.volume.root) || state.driveVolumes[0]
    return buildSnapshot(state)
  } catch (error) {
    if (error?.code === 'SCAN_CANCELLED') {
      error.scanId = scanId
      throw error
    }
    error.scanId = scanId
    throw error
  }
}

export { ScanAbortedError, IS_WINDOWS }
