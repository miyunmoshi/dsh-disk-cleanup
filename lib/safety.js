import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export const IS_WINDOWS = process.platform === 'win32'
export const HOME = os.homedir()
export const LOCALAPPDATA = process.env.LOCALAPPDATA || path.join(HOME, 'AppData', 'Local')
export const APPDATA = process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming')
export const LOCALLOW = path.join(LOCALAPPDATA, 'Low')
export const SYSTEM_ROOT = process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows'
export const USER_TEMP = path.join(LOCALAPPDATA, 'Temp')
export const SYSTEM_TEMP = path.join(SYSTEM_ROOT, 'Temp')
export const SYSTEM_LOGS = path.join(SYSTEM_ROOT, 'Logs')
export const APP_ROOT = path.join(LOCALAPPDATA, 'DSH Disk Cleanup')
export const QUARANTINE_ROOT = path.join(APP_ROOT, 'Quarantine')
export const QUARANTINE_INDEX_FILE = path.join(APP_ROOT, 'quarantine-roots.json')
export const STATE_FILE = path.join(APP_ROOT, 'last-scan.json')
export const SYSTEM_DRIVE_ROOT = path.parse(HOME).root || 'C:\\'
export const SCAN_VERSION = 2
export const API_PREFIX = '/dsh-disk-cleanup/api'

const CASE_INSENSITIVE = IS_WINDOWS

export function normalizePath(value) {
  return path.resolve(String(value))
}

export function pathKey(value) {
  const resolved = normalizePath(value)
  return CASE_INSENSITIVE ? resolved.toLowerCase() : resolved
}

export function isPathInside(parent, child, allowEqual = true) {
  const base = pathKey(parent)
  const target = pathKey(child)
  if (base === target) return allowEqual
  return target.startsWith(base.endsWith(path.sep) ? base : `${base}${path.sep}`)
}

export function isCloudPath(value) {
  const text = pathKey(value)
  return (
    text.includes(`${path.sep}onedrive${path.sep}`) ||
    text.includes(`${path.sep}dropbox${path.sep}`) ||
    text.includes(`${path.sep}googledrive${path.sep}`) ||
    /\\(?:icloud|box|nutstore|jianguoyun)(?:\\|$)/i.test(text)
  )
}

const PROTECTED_DIR_NAMES = new Set([
  '.aws',
  '.dsh',
  '.git',
  '.gnupg',
  '.ssh',
  '$recycle.bin',
  '$dsh-disk-cleanup',
  'system volume information',
  'recovery',
  'windowsapps',
])

export function isProtectedDirName(name) {
  return PROTECTED_DIR_NAMES.has(String(name).toLowerCase())
}

const FORBIDDEN_PREFIXES = [
  SYSTEM_ROOT,
  process.env.ProgramFiles || 'C:\\Program Files',
  process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
  process.env.ProgramData || 'C:\\ProgramData',
  path.join(HOME, '.ssh'),
  path.join(HOME, '.aws'),
  path.join(HOME, '.gnupg'),
  path.join(HOME, '.dsh'),
  path.join(HOME, 'OneDrive'),
  APP_ROOT,
]

const FORBIDDEN_EXCEPTIONS = [SYSTEM_TEMP, SYSTEM_LOGS]

const FORBIDDEN_PATH_PARTS = new Set([
  'cookies',
  'login data',
  'web data',
  'history',
  'bookmarks',
  'indexeddb',
  'local storage',
  'session storage',
  'webstorage',
  'network',
  'webcache',
  'extensions',
  'extension state',
  'local extension settings',
  'managed extension settings',
  'sync data',
  'sync app settings',
  'widevinecdm',
  'meipreload',
  '$dsh-disk-cleanup',
])

const SENSITIVE_FILE_NAMES = new Set([
  'cookies',
  'cookies-journal',
  'login data',
  'login data-journal',
  'web data',
  'history',
  'bookmarks',
  'preferences',
  'local state',
  'wallet.dat',
])

const SENSITIVE_FILE_EXTENSIONS = new Set(['.kdbx', '.pem', '.key', '.pfx', '.p12'])

function isUnderForbiddenPrefix(target) {
  if (FORBIDDEN_EXCEPTIONS.some((root) => isPathInside(root, target))) return false
  return FORBIDDEN_PREFIXES.some((root) => isPathInside(root, target))
}

function hasForbiddenPathPart(target) {
  const parts = target.toLowerCase().split(/[\\/]+/).filter(Boolean)
  if (parts.some((part) => FORBIDDEN_PATH_PARTS.has(part))) return true
  const name = parts[parts.length - 1]
  if (!name) return false
  if (SENSITIVE_FILE_NAMES.has(name)) return true
  if (/^\.env(?:\.|$)/i.test(name)) return true
  return SENSITIVE_FILE_EXTENSIONS.has(path.extname(name))
}

export function isForbiddenCleanupPath(value) {
  const target = normalizePath(value)
  if (target === path.parse(target).root) return true
  if (isCloudPath(target)) return true
  if (hasForbiddenPathPart(target)) return true
  if (isUnderForbiddenPrefix(target)) {
    if (![SYSTEM_TEMP, SYSTEM_LOGS].some((root) => isPathInside(root, target))) return true
  }
  return false
}

export function isSafeRestorePath(value) {
  if (!path.isAbsolute(String(value))) return false
  return !isForbiddenCleanupPath(value)
}

export function assertInside(parent, child, code = 'PATH_OUTSIDE_ROOT') {
  if (!isPathInside(parent, child)) {
    const error = new Error(`路径不属于允许的目录：${child}`)
    error.code = code
    throw error
  }
  return normalizePath(child)
}

export function buildCleanupRoots(extraRoots = []) {
  const roots = [LOCALAPPDATA, APPDATA, LOCALLOW, USER_TEMP, SYSTEM_TEMP, SYSTEM_LOGS]
  for (const candidate of developerCacheRoots()) roots.push(candidate.path)
  for (const candidate of localUserRoots()) roots.push(candidate.path)
  for (const candidate of extraRoots || []) {
    if (typeof candidate === 'string' && path.isAbsolute(candidate)) roots.push(candidate)
  }
  const seen = new Set()
  return roots.filter((root) => {
    if (!root || isCloudPath(root)) return false
    const key = pathKey(root)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function developerCacheRoots() {
  return [
    { path: path.join(LOCALAPPDATA, 'npm-cache'), app: 'npm' },
    { path: path.join(LOCALAPPDATA, 'pnpm'), app: 'pnpm' },
    { path: path.join(LOCALAPPDATA, 'pnpm-cache'), app: 'pnpm' },
    { path: path.join(LOCALAPPDATA, 'pnpm-store'), app: 'pnpm' },
    { path: path.join(LOCALAPPDATA, 'Yarn', 'Cache'), app: 'Yarn' },
    { path: path.join(LOCALAPPDATA, 'pip', 'Cache'), app: 'pip' },
    { path: path.join(LOCALAPPDATA, 'NuGet', 'v3-cache'), app: 'NuGet' },
    { path: path.join(HOME, '.npm', '_cacache'), app: 'npm' },
    { path: path.join(HOME, '.cache'), app: '通用开发缓存' },
    { path: path.join(HOME, '.gradle', 'caches'), app: 'Gradle' },
    { path: path.join(HOME, '.cargo', 'registry', 'cache'), app: 'Cargo' },
  ]
}

export function localUserRoots() {
  const names = ['Downloads', 'Documents', 'Desktop', 'Pictures', 'Videos', 'Music']
  const roots = names.map((name) => ({ path: path.join(HOME, name), label: name }))
  return roots.filter((root) => !isCloudPath(root.path))
}

export function browserAppForPath(value) {
  const text = pathKey(value)
  const rules = [
    { test: /microsoft[\\/]edge|edge[\\/]user data/, label: 'Microsoft Edge' },
    { test: /google[\\/]chrome|chrome[\\/]user data/, label: 'Google Chrome' },
    { test: /brave[\\/]user data|bravesoftware/, label: 'Brave' },
    { test: /mozilla[\\/]firefox|firefox[\\/]profiles/, label: 'Mozilla Firefox' },
    { test: /opera software|opera[\\/]user data/, label: 'Opera' },
    { test: /vivaldi[\\/]user data/, label: 'Vivaldi' },
    { test: /360se|360chrome|360极速|360安全/, label: '360 浏览器' },
    { test: /sogou.*explorer|sogouexplorer/, label: '搜狗浏览器' },
  ]
  const match = rules.find((rule) => rule.test.test(text))
  return match ? match.label : null
}

export async function pathExists(value) {
  try {
    await fs.lstat(value)
    return true
  } catch {
    return false
  }
}

export async function readVolumeInfo(rootPath = path.parse(HOME).root || 'C:\\') {
  try {
    const stats = await fs.statfs(rootPath)
    const blockSize = Number(stats.bsize) || 0
    const total = Number(stats.blocks) * blockSize
    const free = Number(stats.bavail) * blockSize
    return {
      root: rootPath,
      total,
      free,
      used: Math.max(0, total - free),
      percentUsed: total > 0 ? Math.round(((total - free) / total) * 100) : 0,
    }
  } catch {
    return { root: rootPath, total: 0, free: 0, used: 0, percentUsed: 0 }
  }
}

export function isLoopbackRequest(req) {
  const address = req.socket?.remoteAddress || ''
  return (
    address === '127.0.0.1' ||
    address === '::1' ||
    address === '::ffff:127.0.0.1' ||
    address === '::ffff:7f00:1'
  )
}

export function formatError(error) {
  if (!error) return { code: 'UNKNOWN', message: '未知错误' }
  if (typeof error === 'string') return { code: 'ERROR', message: error }
  return {
    code: error.code || 'ERROR',
    message: error.message || String(error),
  }
}
