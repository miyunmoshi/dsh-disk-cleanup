import { randomBytes, randomUUID } from 'node:crypto'

import {
  API_PREFIX,
  formatError,
  isLoopbackRequest,
  readVolumeInfo,
} from './safety.js'
import { scanDisk, ScanAbortedError } from './scanner.js'
import { listAvailableDrives } from './drives.js'
import {
  CleanupError,
  listQuarantineBatches,
  loadLastScan,
  pruneSnapshotItems,
  purgeBatch,
  quarantineItems,
  quarantineSummary,
  restoreBatch,
  saveLastScan,
} from './quarantine.js'

const MAX_BODY_BYTES = 2 * 1024 * 1024
const MAX_JOBS = 4

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  })
  res.end(body)
}

function sendError(res, status, error) {
  const detail = formatError(error)
  sendJson(res, status, {
    error: {
      code: detail.code,
      message: detail.message,
      ...(error?.details ? { details: error.details } : {}),
    },
  })
}

async function readJsonBody(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      throw new CleanupError('BODY_TOO_LARGE', '请求体过大')
    }
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object')
    }
    return parsed
  } catch {
    throw new CleanupError('BODY_INVALID', '请求体不是有效的 JSON 对象')
  }
}

function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress || null,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt || null,
    error: job.error || null,
    summary: job.snapshot
      ? {
          scanId: job.snapshot.scanId,
          totals: job.snapshot.totals,
          coverage: job.snapshot.coverage,
          drives: job.snapshot.drives,
        }
      : null,
  }
}

function publicScanSummary(scan) {
  if (!scan) return null
  return {
    scanId: scan.scanId,
    startedAt: scan.startedAt,
    finishedAt: scan.finishedAt,
    elapsedMs: scan.elapsedMs,
    totals: scan.totals,
    categories: scan.categories,
    kinds: scan.kinds,
    drives: scan.drives,
    volume: scan.volume,
    coverage: scan.coverage,
    warnings: scan.warningCount,
    skipped: scan.skipped,
    orphanApps: Array.isArray(scan.orphanApps) ? scan.orphanApps.length : 0,
    installedAppIndex: scan.installedAppIndex,
    platform: scan.platform,
  }
}

function purgeOldJobs(jobs) {
  if (jobs.size <= MAX_JOBS) return
  const sorted = [...jobs.values()].sort((left, right) => String(left.startedAt).localeCompare(String(right.startedAt)))
  while (sorted.length > MAX_JOBS) {
    const job = sorted.shift()
    if (job && job.status !== 'running') jobs.delete(job.id)
  }
}

export function createDiskDoctorApi({ webServer, config = {} }) {
  const token = randomBytes(32).toString('hex')
  const state = {
    jobs: new Map(),
    activeJob: null,
    lastScan: null,
    loadPromise: null,
    loadError: null,
    persistenceWarning: null,
    disposed: false,
  }

  const maxScanMs = Number.isFinite(config.maxScanMs) ? Math.max(15000, config.maxScanMs) : 300000
  const maxCandidates = Number.isFinite(config.maxCandidates) ? Math.max(1000, config.maxCandidates) : 30000

  async function ensureLoaded() {
    if (state.lastScan) return
    if (!state.loadPromise) {
      state.loadPromise = loadLastScan()
        .then((scan) => {
          if (!state.disposed && scan) {
            state.lastScan = scan
            state.jobs.set(scan.scanId, {
              id: scan.scanId,
              status: 'done',
              progress: null,
              startedAt: scan.startedAt,
              finishedAt: scan.finishedAt,
              snapshot: scan,
              error: null,
            })
          }
        })
        .catch((error) => {
          state.loadError = formatError(error)
        })
    }
    await state.loadPromise
  }

  function rememberFinished(job) {
    state.jobs.set(job.id, job)
    purgeOldJobs(state.jobs)
  }

  function startScanJob(body = {}) {
    if (state.activeJob && state.activeJob.status === 'running') {
      throw new CleanupError('SCAN_IN_PROGRESS', '已有扫描正在进行，请等待完成或先取消')
    }
    const id = `scan-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`
    const controller = new AbortController()
    const job = {
      id,
      status: 'running',
      progress: { phase: 'preparing', filesSeen: 0, dirsSeen: 0, candidates: 0, candidateBytes: 0, currentPath: '', elapsedMs: 0 },
      startedAt: new Date().toISOString(),
      finishedAt: null,
      snapshot: null,
      error: null,
      controller,
    }
    state.jobs.set(id, job)
    state.activeJob = job
    const deep = body.deep !== false
    const requestedAge = Number(body.minAgeDays)
    const minAgeDays = Number.isFinite(requestedAge) ? Math.min(30, Math.max(0.25, requestedAge)) : 2
    const drives = Array.isArray(body.drives) ? body.drives : undefined

    scanDisk({
      scanId: id,
      deep,
      minAgeDays,
      drives,
      maxScanMs,
      maxCandidates,
      signal: controller.signal,
      onProgress: (progress) => {
        if (state.disposed) return
        job.progress = progress
      },
    })
      .then((snapshot) => {
        if (state.disposed) return
        job.status = 'done'
        job.snapshot = snapshot
        job.progress = {
          ...(job.progress || {}),
          phase: 'done',
          candidates: snapshot.totals.count,
          candidateBytes: snapshot.totals.bytes,
          elapsedMs: snapshot.elapsedMs,
          partial: snapshot.coverage.partial,
        }
        job.finishedAt = snapshot.finishedAt
        state.lastScan = snapshot
        state.activeJob = null
        rememberFinished(job)
        saveLastScan(snapshot)
          .then(() => {
            state.persistenceWarning = null
          })
          .catch((error) => {
            state.persistenceWarning = formatError(error)
            console.warn('[dsh-disk-cleanup] 无法保存上次扫描结果', error)
          })
      })
      .catch((error) => {
        if (state.disposed) return
        job.status = error?.code === 'SCAN_CANCELLED' || error instanceof ScanAbortedError ? 'cancelled' : 'error'
        job.error =
          job.status === 'cancelled'
            ? { code: 'SCAN_CANCELLED', message: '扫描已取消' }
            : formatError(error)
        job.finishedAt = new Date().toISOString()
        state.activeJob = null
        rememberFinished(job)
      })

    return job
  }

  async function handle(req, res) {
    try {
      if (!isLoopbackRequest(req)) {
        sendJson(res, 403, { error: { code: 'LOCAL_ONLY', message: '磁盘清理接口仅允许本机访问' } })
        return
      }
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      if (!url.pathname.startsWith(API_PREFIX)) {
        sendJson(res, 404, { error: { code: 'NOT_FOUND', message: '接口不存在' } })
        return
      }
      const subPath = url.pathname.slice(API_PREFIX.length) || '/'
      const method = req.method || 'GET'

      if (subPath === '/handshake' && method === 'GET') {
        sendJson(res, 200, {
          token,
          apiVersion: 2,
          platform: process.platform,
          localOnly: true,
        })
        return
      }
      if (subPath === '/health' && method === 'GET') {
        sendJson(res, 200, { ok: true, version: 2 })
        return
      }

      const provided = req.headers['x-dsh-disk-cleanup-token']
      if (typeof provided !== 'string' || provided !== token) {
        sendJson(res, 401, { error: { code: 'UNAUTHORIZED', message: '缺少有效的本机会话令牌，请刷新页面' } })
        return
      }
      if (method !== 'GET' && method !== 'HEAD') {
        const origin = req.headers.origin
        if (origin) {
          let accepted = false
          try {
            const parsed = new URL(origin)
            const host = req.headers.host
            accepted =
              ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsed.hostname) &&
              (!host || parsed.host === host)
          } catch {
            accepted = false
          }
          if (!accepted) {
            sendJson(res, 403, { error: { code: 'ORIGIN_REJECTED', message: '请求来源不匹配' } })
            return
          }
        } else {
          const fetchSite = req.headers['sec-fetch-site']
          if (fetchSite && fetchSite !== 'same-origin') {
            sendJson(res, 403, { error: { code: 'ORIGIN_REJECTED', message: '请求来源不匹配' } })
            return
          }
        }
      }

      await ensureLoaded()

      if (subPath === '/state' && method === 'GET') {
        const volume = await readVolumeInfo()
        const drives = await listAvailableDrives()
        const active = state.activeJob ? publicJob(state.activeJob) : null
        sendJson(res, 200, {
          apiVersion: 2,
          platform: process.platform,
          volume,
          drives,
          lastScan: publicScanSummary(state.lastScan),
          activeScan: active,
          quarantine: await quarantineSummary(),
          config: { maxScanMs, maxCandidates },
          persistenceWarning: state.persistenceWarning,
          loadError: state.loadError,
        })
        return
      }

      if (subPath === '/last-scan' && method === 'GET') {
        sendJson(res, 200, { scan: state.lastScan })
        return
      }

      if (subPath === '/scan' && method === 'POST') {
        const body = await readJsonBody(req)
        const job = startScanJob(body)
        sendJson(res, 202, { scanId: job.id, job: publicJob(job) })
        return
      }

      const cancelMatch = /^\/scans\/([^/]+)\/cancel$/.exec(subPath)
      if (cancelMatch && method === 'POST') {
        const id = decodeURIComponent(cancelMatch[1])
        const job = state.jobs.get(id)
        if (!job) {
          sendJson(res, 404, { error: { code: 'SCAN_NOT_FOUND', message: '找不到该扫描任务' } })
          return
        }
        if (job.status !== 'running') {
          sendJson(res, 409, { error: { code: 'SCAN_NOT_RUNNING', message: '扫描任务已经结束' } })
          return
        }
        job.controller.abort()
        sendJson(res, 202, { scanId: id, cancelRequested: true })
        return
      }

      const statusMatch = /^\/scans\/([^/]+)\/status$/.exec(subPath)
      if (statusMatch && method === 'GET') {
        const id = decodeURIComponent(statusMatch[1])
        const job = state.jobs.get(id)
        if (!job) {
          sendJson(res, 404, { error: { code: 'SCAN_NOT_FOUND', message: '找不到该扫描任务' } })
          return
        }
        sendJson(res, 200, publicJob(job))
        return
      }

      const scanMatch = /^\/scans\/([^/]+)$/.exec(subPath)
      if (scanMatch && method === 'GET') {
        const id = decodeURIComponent(scanMatch[1])
        const job = state.jobs.get(id)
        if (!job) {
          sendJson(res, 404, { error: { code: 'SCAN_NOT_FOUND', message: '找不到该扫描任务' } })
          return
        }
        if (job.status === 'done' && job.snapshot) {
          sendJson(res, 200, { scan: job.snapshot })
        } else {
          sendJson(res, 200, { job: publicJob(job) })
        }
        return
      }

      if (subPath === '/cleanup' && method === 'POST') {
        const body = await readJsonBody(req)
        if (body.confirm !== true) {
          throw new CleanupError('CONFIRMATION_REQUIRED', '清理操作需要明确确认')
        }
        if (!state.lastScan || (body.scanId && body.scanId !== state.lastScan.scanId)) {
          throw new CleanupError('SCAN_STALE', '扫描结果已更新，请刷新后重新选择')
        }
        const result = await quarantineItems(state.lastScan, body.itemIds, {
          acknowledgeRisky: body.acknowledgeRisky === true,
          acknowledgeProtected: body.acknowledgeProtected === true,
        })
        if (result.cleanedCount > 0) {
          state.lastScan = pruneSnapshotItems(state.lastScan, result.cleanedIds)
          const job = state.jobs.get(state.lastScan.scanId)
          if (job) job.snapshot = state.lastScan
          saveLastScan(state.lastScan).catch((error) => {
            state.persistenceWarning = formatError(error)
            console.warn('[dsh-disk-cleanup] 无法更新扫描结果', error)
          })
        }
        sendJson(res, 200, {
          result,
          scan: state.lastScan
            ? {
                scanId: state.lastScan.scanId,
                totals: state.lastScan.totals,
                categories: state.lastScan.categories,
              }
            : null,
          quarantine: await quarantineSummary(),
        })
        return
      }

      if (subPath === '/quarantine' && method === 'GET') {
        const [batches, summary] = await Promise.all([listQuarantineBatches(), quarantineSummary()])
        sendJson(res, 200, { batches, summary })
        return
      }

      const restoreMatch = /^\/quarantine\/([^/]+)\/restore$/.exec(subPath)
      if (restoreMatch && method === 'POST') {
        const body = await readJsonBody(req)
        if (body.confirm !== true) {
          throw new CleanupError('CONFIRMATION_REQUIRED', '恢复操作需要明确确认')
        }
        const result = await restoreBatch(decodeURIComponent(restoreMatch[1]))
        sendJson(res, 200, { result, quarantine: await quarantineSummary() })
        return
      }

      const purgeMatch = /^\/quarantine\/([^/]+)\/purge$/.exec(subPath)
      if (purgeMatch && method === 'POST') {
        const body = await readJsonBody(req)
        const result = await purgeBatch(decodeURIComponent(purgeMatch[1]), body.confirm)
        sendJson(res, 200, { result, quarantine: await quarantineSummary() })
        return
      }

      sendJson(res, 404, { error: { code: 'NOT_FOUND', message: '接口不存在' } })
    } catch (error) {
      if (state.disposed) return
      const status = error?.code === 'UNAUTHORIZED' ? 401 : error?.code === 'SCAN_IN_PROGRESS' ? 409 : 400
      console.warn('[dsh-disk-cleanup] API 错误', error)
      if (!res.headersSent) sendError(res, status, error)
      else res.destroy()
    }
  }

  return {
    handler: handle,
    async start() {
      await ensureLoaded()
    },
    dispose() {
      state.disposed = true
      if (state.activeJob?.controller) state.activeJob.controller.abort()
      state.activeJob = null
    },
    get token() {
      return token
    },
  }
}
