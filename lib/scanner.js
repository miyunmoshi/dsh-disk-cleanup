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
  SYSTEM_LOGS,
  SYSTEM_TEMP,
  USER_TEMP,
  browserAppForPath,
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
  buildExplanation,
  extensionOf,
  fileRule,
  isInstallerLike,
  isLogFile,
  specialDirectoryRule,
} from './explain.js'

const DAY_MS = 24 * 60 * 60 * 1000
const LARGE_FILE_BYTES = 150 * 1024 * 1024
const DUPLICATE_MIN_BYTES = 1024 * 1024
const DUPLICATE_MAX_BYTES = 250 * 1024 * 1024
const MAX_HASH_BYTES = 1536 * 1024 * 1024
const MAX_HASH_FILES = 600
const MAX_HASH_GROUPS = 120
const MAX_WARNINGS = 240

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

function buildScanRoots() {
  const roots = []
  const seen = new Set()
  const add = (root) => {
    const key = pathKey(root.path)
    if (seen.has(key)) return
    seen.add(key)
    roots.push(root)
  }

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
  add({ id: 'recycle-bin', path: path.parse(HOME).root + '$Recycle.Bin', label: 'Windows 回收站', mode: 'recycle', requiresAdmin: false })
  return roots
}

function createState(scanId, options, onProgress) {
  const now = Date.now()
  const state = {
    scanId,
    startedAt: new Date(now).toISOString(),
    startedAtMs: now,
    deadline: now + (options.maxScanMs || 180000),
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

function addCandidate(state, input) {
  const key = pathKey(input.filePath)
  if (state.itemByKey.has(key)) return false
  if (state.items.length >= (state.options.maxCandidates || 25000)) {
    state.truncated = true
    state.partial = true
    state.stopReason = 'candidate-limit'
    state.skipped.limit += 1
    return false
  }
  const ageDays = Math.max(0, (Date.now() - input.modifiedMs) / DAY_MS)
  const appName = input.appName || appNameForPath(input.filePath)
  const explanation = buildExplanation({
    categoryId: input.categoryId,
    rule: input.rule,
    filePath: input.filePath,
    size: input.size,
    ageDays,
    appName,
    duplicateOf: input.duplicateOf,
    requiresAdmin: input.requiresAdmin,
  })
  const item = {
    id: `item-${state.itemSeq + 1}`,
    categoryId: input.categoryId,
    groupId: `${input.categoryId}::${appName}`,
    app: appName,
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
    if (options.rule === 'browser-sw' && isLockName(entry.name)) return
    addCandidate(state, {
      categoryId: rule.categoryId,
      rule: options.ruleOverride || rule.rule,
      filePath: fullPath,
      size: stat.size,
      modifiedMs: stat.mtimeMs,
      risk: rule.risk || 'safe',
      protected: false,
      requiresAdmin: Boolean(root.requiresAdmin),
      appName: options.appName || appNameForPath(fullPath, root.label),
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

async function walkAppDataDir(state, root, dirPath, depth) {
  if (!state.check()) return
  state.dirsSeen += 1
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
    const browserApp = browserAppForPath(fullPath)
    const special = specialDirectoryRule(entry.name, fullPath, browserApp)
    if (special) {
      if (special.type === 'cache') {
        await collectDirectoryFiles(state, root, fullPath, special, {
          appName: appNameForPath(fullPath, root.label),
        })
      } else if (special.type === 'crash') {
        await collectDirectoryFiles(state, root, fullPath, special, {
          appName: appNameForPath(fullPath, root.label),
        })
      } else if (special.type === 'updater') {
        await collectDirectoryFiles(state, root, fullPath, special, {
          appName: appNameForPath(fullPath, root.label),
          installerOnly: true,
        })
      } else if (special.type === 'logs') {
        await collectDirectoryFiles(state, root, fullPath, special, {
          appName: appNameForPath(fullPath, root.label),
          logsOnly: true,
        })
      }
      continue
    }
    await walkAppDataDir(state, root, fullPath, depth + 1)
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

  const overview = [...state.overview.values()]
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, 18)

  return {
    version: 1,
    scanId: state.scanId,
    status: 'done',
    startedAt: state.startedAt,
    finishedAt: new Date().toISOString(),
    elapsedMs: Date.now() - state.startedAtMs,
    platform: process.platform,
    volume: state.volume || null,
    roots: state.roots,
    items,
    categories,
    groups,
    totals,
    appDataOverview: overview,
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
    maxScanMs: Number.isFinite(options.maxScanMs) ? Math.max(10000, options.maxScanMs) : 180000,
    maxCandidates: Number.isFinite(options.maxCandidates) ? Math.max(1000, options.maxCandidates) : 25000,
    signal: options.signal,
  }
  const state = createState(scanId, settings, options.onProgress)
  state.volume = await readVolumeInfo()
  const roots = buildScanRoots()
  state.roots = roots.map((root) => ({
    id: root.id,
    path: root.path,
    label: root.label,
    mode: root.mode,
    requiresAdmin: Boolean(root.requiresAdmin),
  }))
  state.report('preparing', '', true)

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
      } else if (root.mode === 'recycle') {
        await walkRecycleBin(state, root)
      }
    }
    if (state.check()) await analyzeDuplicates(state)
    state.phase = 'finalizing'
    state.report('finalizing', '', true)
    if (!state.volume) state.volume = await readVolumeInfo()
    else {
      const after = await readVolumeInfo(state.volume.root)
      state.volume = { ...state.volume, freeAfter: after.free }
    }
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
