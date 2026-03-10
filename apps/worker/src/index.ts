/**
 * [INPUT]: 依赖 hono 的 Hono/cors/logger
 * [OUTPUT]: 对外提供 Cloudflare Worker API 入口
 * [POS]: apps/worker 的主入口，P2 阶段用于 Cloudflare Queues 消费者
 *        当前所有 API 逻辑在 apps/web 的 Next.js API Routes 中
 *        本 Worker 保留为 P2 异步任务队列的消费端骨架
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

/* ─── Bindings 类型 (P1 阶段启用) ───────────────────────── */

type Bindings = {
  ENVIRONMENT: string
  // DB: D1Database
  // UPLOADS: R2Bucket
  // TASK_QUEUE: Queue
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
    version: '0.0.1',
    environment: c.env.ENVIRONMENT,
  })
})

app.get('/', (c) => {
  return c.json({ message: 'Nano Banana Canvas API' })
})

export default app
