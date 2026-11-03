import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  APP_ROOT,
  QUARANTINE_ROOT,
  STATE_FILE,
  buildCleanupRoots,
  formatError,
  isForbiddenCleanupPath,
  isPathInside,
  isSafeRestorePath,
  pathKey,
} from './safety.js'

const BATCH_ID_PATTERN = /^batch-[a-z0-9-]+$/i

export class CleanupError extends Error {
  constructor(code, message, details = undefined) {
    super(message)
    this.code = code
    this.details = details
  }
}

async function ensureDirectories() {
  await fs.mkdir(APP_ROOT, { recursive: true })
  await fs.mkdir(QUARANTINE_ROOT, { recursive: true })
}

async function writeJsonAtomic(target, value) {
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(temp, JSON.stringify(value, null, 2), 'utf8')
  await fs.rename(temp, target)
}

async function readJson(target) {
  try {
    const text = await fs.readFile(target, 'utf8')
    return JSON.parse(text)
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

function insideAnyRoot(target) {
  return buildCleanupRoots().some((root) => isPathInside(root, target))
}

function assertItemTarget(item) {
  const target = path.resolve(item.path)
  if (!insideAnyRoot(target)) {
    throw new CleanupError('PATH_OUTSIDE_ALLOWLIST', `文件不在允许清理的目录内：${target}`)
  }
  if (isForbiddenCleanupPath(target)) {
    throw new CleanupError('PATH_PROTECTED', `文件位于受保护位置：${target}`)
  }
  if (target === path.parse(target).root) {
    throw new CleanupError('PATH_PROTECTED', '不允许处理磁盘根目录')
  }
  return target
}

function quarantinePathFor(batchDir, sourcePath) {
  const root = path.parse(sourcePath).root
  const drive = root.replace(/[:\\/]+/g, '') || 'root'
  const relative = path.relative(root, sourcePath)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new CleanupError('PATH_INVALID', `无法计算隔离路径：${sourcePath}`)
  }
  const target = path.join(batchDir, 'files', drive, relative)
  if (!isPathInside(batchDir, target)) {
    throw new CleanupError('PATH_INVALID', `隔离路径越界：${sourcePath}`)
  }
  return target
}

async function moveAcrossDevices(source, target) {
  try {
    await fs.rename(source, target)
    return 'moved'
  } catch (error) {
    if (error?.code !== 'EXDEV') throw error
    await fs.copyFile(source, target)
    await fs.unlink(source)
    return 'copied'
  }
}

async function uniqueDestination(target) {
  try {
    await fs.lstat(target)
  } catch (error) {
    if (error?.code === 'ENOENT') return target
    throw error
  }
  const extension = path.extname(target)
  const base = target.slice(0, target.length - extension.length)
  for (let index = 1; index < 1000; index += 1) {
    const candidate = `${base} (${index})${extension}`
    try {
      await fs.lstat(candidate)
    } catch (error) {
      if (error?.code === 'ENOENT') return candidate
      throw error
    }
  }
  throw new CleanupError('DESTINATION_EXISTS', '无法为隔离文件生成唯一名称')
}

function validateBatchId(batchId) {
  if (typeof batchId !== 'string' || !BATCH_ID_PATTERN.test(batchId)) {
    throw new CleanupError('BATCH_INVALID', '隔离批次编号无效')
  }
  return batchId
}

function batchDirectory(batchId) {
  const safe = validateBatchId(batchId)
  const dir = path.join(QUARANTINE_ROOT, safe)
  if (!isPathInside(QUARANTINE_ROOT, dir)) {
    throw new CleanupError('BATCH_INVALID', '隔离批次路径越界')
  }
  return dir
}

export async function saveLastScan(snapshot) {
  await ensureDirectories()
  await writeJsonAtomic(STATE_FILE, snapshot)
}

export async function loadLastScan() {
  const snapshot = await readJson(STATE_FILE)
  if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.items)) return null
  if (snapshot.status !== 'done') return null
  return snapshot
}

export async function quarantineItems(snapshot, itemIds, options = {}) {
  if (!snapshot || snapshot.status !== 'done') {
    throw new CleanupError('SCAN_NOT_FOUND', '没有可用的扫描结果，请先重新扫描')
  }
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new CleanupError('NO_SELECTION', '请至少选择一个文件')
  }
  const wanted = new Set(itemIds.map(String))
  const selected = snapshot.items.filter((item) => wanted.has(item.id))
  if (selected.length === 0) {
    throw new CleanupError('NO_SELECTION', '选中的文件不在当前扫描结果中，请重新扫描')
  }
  if (selected.some((item) => !item.cleanable)) {
    throw new CleanupError('NOT_CLEANABLE', '所选内容包含只能查看说明的项目（例如回收站），请取消选择')
  }
  if (selected.some((item) => item.risk !== 'safe') && options.acknowledgeRisky !== true) {
    throw new CleanupError('RISK_ACK_REQUIRED', '所选内容包含需要复核的项目，请先确认风险提示')
  }
  if (selected.some((item) => item.protected) && options.acknowledgeProtected !== true) {
    throw new CleanupError('PROTECTED_ACK_REQUIRED', '所选内容包含用户文件或受保护数据，请先确认保护提示')
  }

  await ensureDirectories()
  const createdAt = new Date().toISOString()
  const batchId = `batch-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`
  const batchDir = batchDirectory(batchId)
  await fs.mkdir(batchDir, { recursive: true })

  const cleaned = []
  const failures = []
  for (const item of selected) {
    try {
      if (!item.cleanable) throw new CleanupError('NOT_CLEANABLE', '该项目不可清理')
      const source = assertItemTarget(item)
      const stat = await fs.lstat(source)
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new CleanupError('NOT_A_FILE', '目标已不是普通文件；为安全起见已跳过')
      }
      if (stat.size !== item.size || Math.abs(stat.mtimeMs - item.modifiedMs) > 2500) {
        throw new CleanupError('FILE_CHANGED', '文件大小或修改时间已变化，请重新扫描后再处理')
      }
      const target = quarantinePathFor(batchDir, source)
      await fs.mkdir(path.dirname(target), { recursive: true })
      const finalTarget = await uniqueDestination(target)
      await moveAcrossDevices(source, finalTarget)
      cleaned.push({
        itemId: item.id,
        originalPath: source,
        quarantinePath: finalTarget,
        size: stat.size,
        modifiedMs: stat.mtimeMs,
        categoryId: item.categoryId,
        risk: item.risk,
      })
    } catch (error) {
      failures.push({
        itemId: item.id,
        path: item.path,
        ...formatError(error),
      })
    }
  }

  if (cleaned.length === 0) {
    await fs.rm(batchDir, { recursive: true, force: true }).catch(() => {})
    return {
      batchId: null,
      createdAt,
      cleanedIds: [],
      cleanedCount: 0,
      cleanedBytes: 0,
      failures,
      totalRequested: selected.length,
    }
  }

  const manifest = {
    version: 1,
    batchId,
    createdAt,
    scanId: snapshot.scanId,
    items: cleaned,
    failures,
  }
  await writeJsonAtomic(path.join(batchDir, 'manifest.json'), manifest)

  return {
    batchId,
    createdAt,
    cleanedIds: cleaned.map((entry) => entry.itemId),
    cleanedCount: cleaned.length,
    cleanedBytes: cleaned.reduce((sum, entry) => sum + entry.size, 0),
    failures,
    totalRequested: selected.length,
  }
}

export async function listQuarantineBatches() {
  await ensureDirectories()
  let entries
  try {
    entries = await fs.readdir(QUARANTINE_ROOT, { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
  const batches = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (!BATCH_ID_PATTERN.test(entry.name)) continue
    try {
      const manifest = await readJson(path.join(QUARANTINE_ROOT, entry.name, 'manifest.json'))
      if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.items)) continue
      const bytes = manifest.items.reduce((sum, item) => sum + (Number(item.size) || 0), 0)
      batches.push({
        id: manifest.batchId || entry.name,
        createdAt: manifest.createdAt || null,
        scanId: manifest.scanId || null,
        count: manifest.items.length,
        bytes,
        failures: Array.isArray(manifest.failures) ? manifest.failures.length : 0,
        preview: manifest.items.slice(0, 12).map((item) => ({
          name: path.basename(item.originalPath || ''),
          path: item.originalPath || '',
          size: Number(item.size) || 0,
          categoryId: item.categoryId || 'unknown',
        })),
      })
    } catch {
      // A corrupt or partially written batch is ignored rather than guessed at.
    }
  }
  batches.sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
  return batches
}

export async function quarantineSummary() {
  const batches = await listQuarantineBatches()
  return {
    batches: batches.length,
    count: batches.reduce((sum, batch) => sum + batch.count, 0),
    bytes: batches.reduce((sum, batch) => sum + batch.bytes, 0),
  }
}

export async function restoreBatch(batchId) {
  const dir = batchDirectory(batchId)
  const manifestPath = path.join(dir, 'manifest.json')
  const manifest = await readJson(manifestPath)
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.items)) {
    throw new CleanupError('BATCH_NOT_FOUND', '找不到可恢复的隔离批次')
  }
  const restored = []
  const failures = []
  const remaining = []
  for (const item of manifest.items) {
    try {
      if (typeof item.originalPath !== 'string' || !isSafeRestorePath(item.originalPath)) {
        throw new CleanupError('RESTORE_PATH_PROTECTED', '原路径不在允许恢复的位置内')
      }
      if (!insideAnyRoot(item.originalPath)) {
        throw new CleanupError('RESTORE_PATH_PROTECTED', '原路径已不在允许恢复的目录内')
      }
      const source = path.resolve(item.quarantinePath)
      if (!isPathInside(dir, source)) {
        throw new CleanupError('RESTORE_PATH_INVALID', '隔离文件路径越界')
      }
      const sourceStat = await fs.lstat(source)
      if (!sourceStat.isFile()) throw new CleanupError('RESTORE_SOURCE_INVALID', '隔离文件不存在或不是普通文件')
      const target = path.resolve(item.originalPath)
      try {
        await fs.lstat(target)
        throw new CleanupError('RESTORE_TARGET_EXISTS', '原位置已经有同名文件，未覆盖')
      } catch (error) {
        if (error?.code !== 'ENOENT' && error?.code !== 'RESTORE_TARGET_EXISTS') throw error
        if (error?.code === 'RESTORE_TARGET_EXISTS') throw error
      }
      await fs.mkdir(path.dirname(target), { recursive: true })
      await moveAcrossDevices(source, target)
      restored.push({ itemId: item.itemId, path: target, size: Number(item.size) || 0 })
    } catch (error) {
      failures.push({
        itemId: item.itemId,
        path: item.originalPath || '',
        ...formatError(error),
      })
      remaining.push(item)
    }
  }
  if (remaining.length === 0) {
    await fs.rm(dir, { recursive: true, force: true })
  } else {
    manifest.items = remaining
    manifest.failures = failures
    await writeJsonAtomic(manifestPath, manifest)
  }
  return {
    batchId,
    restoredCount: restored.length,
    restoredBytes: restored.reduce((sum, entry) => sum + (Number(entry.size) || 0), 0),
    restored,
    failures,
    removed: remaining.length === 0,
  }
}

export async function purgeBatch(batchId, confirmation) {
  if (confirmation !== 'PURGE') {
    throw new CleanupError('CONFIRMATION_REQUIRED', '永久删除需要明确确认')
  }
  const dir = batchDirectory(batchId)
  const manifest = await readJson(path.join(dir, 'manifest.json'))
  if (!manifest || !Array.isArray(manifest.items)) {
    throw new CleanupError('BATCH_NOT_FOUND', '找不到要删除的隔离批次')
  }
  const count = manifest.items.length
  const bytes = manifest.items.reduce((sum, item) => sum + (Number(item.size) || 0), 0)
  await fs.rm(dir, { recursive: true, force: false })
  return { batchId, purgedCount: count, purgedBytes: bytes }
}

export function pruneSnapshotItems(snapshot, removedIds) {
  const removed = new Set(removedIds)
  const items = snapshot.items.filter((item) => !removed.has(item.id))
  const categoryMap = new Map()
  const groupMap = new Map()
  for (const item of items) {
    let category = categoryMap.get(item.categoryId)
    if (!category) {
      category = { id: item.categoryId, count: 0, bytes: 0 }
      categoryMap.set(item.categoryId, category)
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
  const order = ['temp', 'browser', 'appcache', 'update', 'logs', 'devcache', 'recycle', 'large', 'duplicate']
  const rank = new Map(order.map((id, index) => [id, index]))
  const categories = [...categoryMap.values()].sort((l, r) => (rank.get(l.id) ?? 99) - (rank.get(r.id) ?? 99))
  const groups = [...groupMap.values()].sort((l, r) => {
    const byCategory = (rank.get(l.categoryId) ?? 99) - (rank.get(r.categoryId) ?? 99)
    return byCategory !== 0 ? byCategory : r.bytes - l.bytes
  })
  return {
    ...snapshot,
    items,
    categories,
    groups,
    totals: {
      count: items.length,
      bytes: items.reduce((sum, item) => sum + item.size, 0),
      safeBytes: items.filter((item) => item.risk === 'safe').reduce((sum, item) => sum + item.size, 0),
      cautionBytes: items.filter((item) => item.risk === 'caution').reduce((sum, item) => sum + item.size, 0),
      reviewBytes: items.filter((item) => item.risk === 'review').reduce((sum, item) => sum + item.size, 0),
      cleanableCount: items.filter((item) => item.cleanable).length,
      cleanableBytes: items.filter((item) => item.cleanable).reduce((sum, item) => sum + item.size, 0),
    },
  }
}
