/**
 * [INPUT]: 依赖 hono 的 Hono/cors/logger，依赖 cron/* 的两个定时任务，依赖 queue/process-task 的队列消费者，依赖 workflows/image-task-workflow 的长任务编排类
 * [OUTPUT]: 对外提供 Cloudflare Worker API 入口 (HTTP + Queue + Cron Scheduled) 与 ImageTaskWorkflow 导出
 * [POS]: apps/worker 的主入口，HTTP 路由 + Queue 消费 + 每 10 分钟 Cron 调度，并对外暴露 Workflows 编排类
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { TaskQueueMessage } from '@nano-banana/shared'

import { cleanupExpiredOutputs } from './cron/cleanup'
import { markTimedOutTasks } from './cron/timeout'
import { handleTaskQueueMessage } from './queue/process-task'
import { ImageTaskWorkflow } from './workflows/image-task-workflow'
import { createLogger } from '../../web/lib/logger'

/* ─── Bindings 类型 ──────────────────────────────────── */

type Bindings = {
  ENVIRONMENT: string
  DB: D1Database
  UPLOADS: R2Bucket
  KV: KVNamespace
  OPENROUTER_API_KEY?: string
  DEEPSEEK_API_KEY?: string
  GEMINI_API_KEY?: string
  OPENAI_API_KEY?: string
  KLING_ACCESS_KEY?: string
  KLING_SECRET_KEY?: string
  ENCRYPTION_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()
const log = createLogger('worker:index')

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

  async queue(batch: MessageBatch<unknown>, env: Bindings) {
    for (const message of batch.messages) {
      const taskMessage = message.body as TaskQueueMessage
      try {
        log.info('Queue message received', {
          taskId: taskMessage.taskId,
          userId: taskMessage.userId,
        })
        await handleTaskQueueMessage(env, taskMessage)
        message.ack()
      } catch (error) {
        log.error('Queue task processing failed', error, {
          taskId: taskMessage.taskId,
          userId: taskMessage.userId,
        })
        message.retry()
      }
    }
  },

  async scheduled(
    _event: ScheduledEvent,
    env: Bindings,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      (async () => {
        const results = {
          timedOut: { timedOut: 0, refunded: 0 },
          cleaned: { deleted: 0, errors: 0 },
        }

        try {
          results.timedOut = await markTimedOutTasks(env.DB)
        } catch (err) {
          log.error('Cron timeout scan failed', err, {
            environment: env.ENVIRONMENT,
          })
        }

        try {
          results.cleaned = await cleanupExpiredOutputs(env.DB, env.UPLOADS)
        } catch (err) {
          log.error('Cron cleanup failed', err, {
            environment: env.ENVIRONMENT,
          })
        }

        log.info('Cron cycle completed', {
          environment: env.ENVIRONMENT,
          results,
        })
      })(),
    )
  },
}

export { ImageTaskWorkflow }
