/**
 * [INPUT]: 依赖 @nano-banana/shared 的 TaskQueueMessage，依赖 ../../../web/lib/tasks 的 processQueuedTask/TaskServiceRuntime
 * [OUTPUT]: 对外提供 WorkerTaskBindings/createWorkerTaskRuntime/handleTaskQueueMessage，用 Worker 绑定把队列或 Workflow 事件桥接到共享任务服务
 * [POS]: worker/queue 的消费者适配层，把 Cloudflare Queue/Workflow 运行时统一转换为 web 任务服务可执行的 runtime
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { TaskQueueMessage } from '@nano-banana/shared'

import { processQueuedTask, type TaskServiceRuntime } from '../../../web/lib/tasks'

export type WorkerTaskBindings = {
  DB: D1Database
  KV: KVNamespace
  UPLOADS: R2Bucket
  OPENROUTER_API_KEY?: string
  DEEPSEEK_API_KEY?: string
  GEMINI_API_KEY?: string
  OPENAI_API_KEY?: string
  KLING_ACCESS_KEY?: string
  KLING_SECRET_KEY?: string
  ENCRYPTION_KEY?: string
}

const PLATFORM_ENV_KEY_MAP: Record<string, keyof WorkerTaskBindings> = {
  openrouter: 'OPENROUTER_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  gemini: 'GEMINI_API_KEY',
}

function requireBinding(env: WorkerTaskBindings, key: keyof WorkerTaskBindings): string {
  const value = env[key]
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export function createWorkerTaskRuntime(env: WorkerTaskBindings): TaskServiceRuntime {
  return {
    requireEnv: async (key) => requireBinding(env, key as keyof WorkerTaskBindings),
    getR2: async () => env.UPLOADS,
    invalidateStorageCache: async (userId) => {
      await env.KV.delete(`storage:${userId}:usage`)
    },
    getPlatformKey: async (provider) => {
      const envKey = PLATFORM_ENV_KEY_MAP[provider]
      if (!envKey) {
        throw new Error(`No platform key mapping for provider: ${provider}`)
      }
      return requireBinding(env, envKey)
    },
  }
}

export async function handleTaskQueueMessage(
  env: WorkerTaskBindings,
  message: TaskQueueMessage,
): Promise<void> {
  await processQueuedTask(env.DB, message, createWorkerTaskRuntime(env))
}
