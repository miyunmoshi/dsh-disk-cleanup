import { API_PREFIX } from './lib/safety.js'
import { createDiskDoctorApi } from './lib/api.js'

export const name = 'dsh-disk-cleanup'
export const inject = ['webServer']

export function apply(ctx, config = {}) {
  const api = createDiskDoctorApi({ webServer: ctx.webServer, config })

  ctx.effect(() => {
    const disposeRoute = ctx.webServer.register({
      kind: 'prefix',
      path: API_PREFIX,
      handler: api.handler,
    })
    api.start().catch((error) => {
      console.warn('[dsh-disk-cleanup] 初始化上次扫描结果失败', error)
    })
    return () => {
      disposeRoute()
      api.dispose()
    }
  }, 'dsh-disk-cleanup: local API')
}
