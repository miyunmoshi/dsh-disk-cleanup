import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const DRIVE_LETTERS = 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const SYSTEM_ROOT = (process.env.SystemDrive ? `${process.env.SystemDrive}\\` : path.parse(os.homedir()).root) || 'C:\\'
const CACHE_TTL_MS = 15 * 1000

let cachedDrives = null
let cachedAt = 0

function withTimeout(promise, milliseconds) {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error('timeout'))
    }, milliseconds)
    promise.then(
      (value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function volumeOfRoot(root) {
  const stats = await fs.statfs(root)
  const blockSize = Number(stats.bsize) || 0
  const total = Number(stats.blocks) * blockSize
  const free = Number(stats.bavail) * blockSize
  if (total <= 0) return null
  return {
    root,
    letter: root.replace(/[\\/]+$/, ''),
    label: root.replace(/[\\/]+$/, ''),
    total,
    free,
    used: Math.max(0, total - free),
    percentUsed: Math.round(((total - free) / total) * 100),
    isSystem: path.resolve(root).toLowerCase() === path.resolve(SYSTEM_ROOT).toLowerCase(),
  }
}

/**
 * Enumerate readable local drive letters with capacity information. The
 * timeout prevents one disconnected network/optical drive from blocking the
 * workspace. A timed-out probe leaves no state behind.
 * @param {{force?: boolean}} [options]
 * @returns {Promise<Array<{root:string,letter:string,total:number,free:number,used:number,percentUsed:number,isSystem:boolean}>>}
 */
export async function listAvailableDrives(options = {}) {
  const now = Date.now()
  if (!options.force && cachedDrives && now - cachedAt < CACHE_TTL_MS) return cachedDrives
  if (process.platform !== 'win32') {
    try {
      const volume = await volumeOfRoot('/')
      cachedDrives = volume ? [volume] : []
    } catch {
      cachedDrives = []
    }
    cachedAt = now
    return cachedDrives
  }

  const probes = await Promise.all(
    DRIVE_LETTERS.map(async (letter) => {
      const root = `${letter}:\\`
      try {
        return await withTimeout(volumeOfRoot(root), 1500)
      } catch {
        return null
      }
    }),
  )
  cachedDrives = probes
    .filter(Boolean)
    .sort((left, right) => {
      if (left.isSystem !== right.isSystem) return left.isSystem ? -1 : 1
      return left.letter.localeCompare(right.letter)
    })
  cachedAt = now
  return cachedDrives
}

function normalizeRoot(value, available) {
  const text = String(value || '').trim()
  if (!text) return null
  const drive = text.match(/^([A-Za-z]):(?:[\\/]|$)/)
  if (drive) {
    const root = `${drive[1].toUpperCase()}:\\`
    return available.find((entry) => entry.root.toLowerCase() === root.toLowerCase())?.root || null
  }
  return available.find((entry) => entry.root.toLowerCase() === text.toLowerCase())?.root || null
}

/**
 * Normalize a user/API drive selection against currently available drives.
 * A missing or empty selection means the system drive. At least one drive is
 * always returned when any drive is readable.
 * @param {string[]|undefined} input
 * @returns {Promise<{drives:Array<object>, selected:Array<object>}>}
 */
export async function normalizeDriveSelection(input) {
  const available = await listAvailableDrives()
  if (available.length === 0) return { drives: [], selected: [] }
  const wanted = Array.isArray(input) ? input : []
  const selected = []
  for (const value of wanted) {
    const root = normalizeRoot(value, available)
    if (!root) continue
    if (!selected.some((entry) => entry.root === root)) {
      const volume = available.find((entry) => entry.root === root)
      if (volume) selected.push(volume)
    }
  }
  if (selected.length === 0) {
    selected.push(available.find((entry) => entry.isSystem) || available[0])
  }
  return { drives: selected, selected }
}

export function driveRootOfPath(value) {
  return path.parse(String(value)).root
}

export function isSystemDriveRoot(value) {
  return path.resolve(String(value)).toLowerCase() === path.resolve(SYSTEM_ROOT).toLowerCase()
}

/**
 * Reversible quarantine lives on the same volume as the source file. The
 * system volume keeps using the app's user-data folder; other volumes use a
 * private `$DSH-Disk-Cleanup` folder at the drive root.
 * @param {string} sourcePath
 * @param {string} systemAppRoot
 */
export function quarantineRootForSource(sourcePath, systemAppRoot) {
  const driveRoot = driveRootOfPath(sourcePath)
  if (isSystemDriveRoot(driveRoot)) return systemAppRoot
  return path.join(driveRoot, '$DSH-Disk-Cleanup', 'Quarantine')
}

export { DRIVE_LETTERS, SYSTEM_ROOT }
