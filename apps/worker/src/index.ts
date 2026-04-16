/**
 * [INPUT]: 依赖 hono 的 Hono/cors/logger，依赖 cron/* 的两个定时任务
 * [OUTPUT]: 对外提供 Cloudflare Worker API 入口 (HTTP + Cron Scheduled)
 * [POS]: apps/worker 的主入口，HTTP 路由 + 每 10 分钟 Cron 调度
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { cleanupExpiredOutputs } from './cron/cleanup'
import { markTimedOutTasks } from './cron/timeout'

/* ─── Bindings 类型 ──────────────────────────────────── */

type Bindings = {
  ENVIRONMENT: string
  DB: D1Database
  UPLOADS: R2Bucket
  KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

/* ─── 中间件 ────────────────────────────────────────────── */

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://nanobananacanvas.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

/* ─── 路由 ──────────────────────────────────────────────── */

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: c.env.ENVIRONMENT,
  })
})

app.get('/', (c) => {
  return c.json({ message: 'Nano Banana Canvas API' })
})

/* ─── Cron Scheduled Handler ────────────────────────────── */

export default {
  fetch: app.fetch,

  async scheduled(
    _event: ScheduledEvent,
    env: Bindings,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      (async () => {
        const results = {
          timedOut: 0,
          cleaned: { deleted: 0, errors: 0 },
        }

        try {
          results.timedOut = await markTimedOutTasks(env.DB)
        } catch (err) {
          console.error('[cron] timeout failed:', err)
        }

        try {
          results.cleaned = await cleanupExpiredOutputs(env.DB, env.UPLOADS)
        } catch (err) {
          console.error('[cron] cleanup failed:', err)
        }

        console.log('[cron] completed:', JSON.stringify(results))
      })(),
    )
  },
}
