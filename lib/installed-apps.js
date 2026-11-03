import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const UNINSTALL_KEYS = [
  'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
]

const CACHE_TTL_MS = 5 * 60 * 1000
const GENERIC_TOKENS = new Set([
  'app',
  'apps',
  'application',
  'applications',
  'common',
  'component',
  'components',
  'corp',
  'corporation',
  'data',
  'desktop',
  'edition',
  'inc',
  'limited',
  'ltd',
  'microsoft',
  'platform',
  'program',
  'programs',
  'service',
  'services',
  'software',
  'system',
  'technologies',
  'technology',
  'update',
  'updater',
  'updates',
  'version',
  'windows',
  'x64',
  'x86',
])

let cachedResult = null
let cachedAt = 0

function decodeRegBuffer(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le')
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer.subarray(2))
    if (swapped.length % 2 === 0) swapped.swap16()
    return swapped.toString('utf16le')
  }
  return buffer.toString('utf8').replace(/^\uFEFF/, '')
}

function parseRegString(raw) {
  const text = String(raw).trim()
  if (text.startsWith('"')) {
    try {
      return JSON.parse(text)
    } catch {
      return text.replace(/^"|"$/g, '').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    }
  }
  if (text.startsWith('hex(2):') || text.startsWith('hex(7):')) {
    const hex = text.slice(text.indexOf(':') + 1).replace(/[,\s\\]/g, '')
    try {
      return Buffer.from(hex, 'hex').toString('utf16le').replace(/\0+$/g, '')
    } catch {
      return ''
    }
  }
  if (text.startsWith('dword:')) {
    const value = Number.parseInt(text.slice(6), 16)
    return Number.isFinite(value) ? value : 0
  }
  return text
}

function parseRegFile(text) {
  const records = []
  let current = null
  const lines = text.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (!line || line.startsWith(';') || line === 'Windows Registry Editor Version 5.00' || line === 'REGEDIT4') continue
    if (line.startsWith('[') && line.endsWith(']')) {
      current = { key: line.slice(1, -1), values: {} }
      records.push(current)
      continue
    }
    if (!current) continue
    const match = /^"((?:[^"\\]|\\.)*)"=(.*)$/.exec(line)
    if (!match) continue
    const name = match[1].replace(/\\(.)/g, '$1')
    let rawValue = match[2]
    while (/\\$/.test(rawValue) && index + 1 < lines.length) {
      index += 1
      rawValue = `${rawValue.slice(0, -1)}${lines[index].trim()}`
    }
    current.values[name] = parseRegString(rawValue)
  }
  return records
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ')
    .trim()
}

function tokensOf(value) {
  return [...new Set(normalize(value).split(/\s+/).filter((token) => token.length > 1 && !GENERIC_TOKENS.has(token)))]
}

function buildIndex(apps) {
  return {
    available: apps.length > 0,
    apps,
    entries: apps.map((app) => {
      const name = normalize(app.displayName)
      const installBase = app.installLocation ? normalize(path.basename(app.installLocation)) : ''
      const publisher = normalize(app.publisher)
      return {
        name,
        installBase,
        tokens: new Set([...tokensOf(app.displayName), ...tokensOf(installBase), ...tokensOf(publisher)]),
      }
    }),
  }
}

function matchQuery(query, index) {
  if (!index?.available) return null
  const normalized = normalize(query)
  if (!normalized) return false
  const queryTokens = tokensOf(query)
  const queryHasChinese = /[\u3400-\u9fff]/.test(query)
  for (const entry of index.entries) {
    if (entry.name === normalized || entry.installBase === normalized) return true
    if (entry.name.length >= 4 && (entry.name.includes(normalized) || normalized.includes(entry.name))) return true
    if (entry.installBase.length >= 4 && (entry.installBase.includes(normalized) || normalized.includes(entry.installBase))) return true
    if (queryTokens.length > 0) {
      let intersection = 0
      for (const token of queryTokens) {
        if (entry.tokens.has(token)) intersection += 1
      }
      if (intersection >= 1) {
        if (queryTokens.length <= 2 || entry.tokens.size <= 3) return true
      }
    }
    if (queryHasChinese && entry.name.includes(normalized)) return true
  }
  return false
}

export async function getInstalledApps(options = {}) {
  const now = Date.now()
  if (!options.force && cachedResult && now - cachedAt < CACHE_TTL_MS) return cachedResult
  if (process.platform !== 'win32') {
    cachedResult = { available: false, apps: [], entries: [], errors: ['当前系统不是 Windows，未启用已安装应用登记检测。'] }
    cachedAt = now
    return cachedResult
  }

  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dsh-disk-cleanup-reg-'))
  const errors = []
  const records = []
  try {
    for (let index = 0; index < UNINSTALL_KEYS.length; index += 1) {
      const file = path.join(temporaryDirectory, `uninstall-${index}.reg`)
      try {
        await execFileAsync('reg.exe', ['export', UNINSTALL_KEYS[index], file, '/y'], {
          windowsHide: true,
          timeout: 12000,
          maxBuffer: 8 * 1024 * 1024,
        })
      } catch (error) {
        errors.push(`${UNINSTALL_KEYS[index]}: ${error?.message || error}`)
        continue
      }
      try {
        const buffer = await fs.readFile(file)
        records.push(...parseRegFile(decodeRegBuffer(buffer)))
      } catch (error) {
        errors.push(`${UNINSTALL_KEYS[index]}: ${error?.message || error}`)
      }
    }
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {})
  }

  const seen = new Set()
  const apps = []
  for (const record of records) {
    const values = record.values || {}
    const displayName = typeof values.DisplayName === 'string' ? values.DisplayName.trim() : ''
    if (!displayName) continue
    if (Number(values.SystemComponent) === 1) continue
    if (typeof values.ParentKeyName === 'string' && values.ParentKeyName.trim()) continue
    const key = `${record.key}|${displayName}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    apps.push({
      displayName,
      installLocation: typeof values.InstallLocation === 'string' ? values.InstallLocation.trim() : '',
      publisher: typeof values.Publisher === 'string' ? values.Publisher.trim() : '',
      version: typeof values.DisplayVersion === 'string' ? values.DisplayVersion.trim() : '',
      key: record.key,
    })
  }

  cachedResult = { ...buildIndex(apps), errors }
  cachedAt = now
  return cachedResult
}

/**
 * Conservative installed-app check used to avoid flagging active portable /
 * installed applications as uninstall leftovers. A null result means the
 * registry index is unavailable; callers must not mark orphan candidates then.
 * @param {string} dirName
 * @param {string} parentName
 * @param {{available:boolean, entries:unknown[]}} index
 * @returns {boolean|null}
 */
export function isInstalledApplication(dirName, parentName, index) {
  if (!index?.available) return null
  const query = [parentName, dirName].filter(Boolean).join(' ')
  return matchQuery(query, index)
}
