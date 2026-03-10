/**
 * [INPUT]: 依赖 zod 的 z
 * [OUTPUT]: 对外提供 submitTaskSchema, listTasksSchema
 * [POS]: lib/validations 的异步任务请求验证，被 /api/tasks 端点消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

/* ─── Submit Task ───────────────────────────────────── */

export const submitTaskSchema = z.object({
  taskType: z.enum(['video_gen', 'image_gen', 'audio_gen']),
  provider: z.string().min(1, 'Provider is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  executionMode: z.enum(['credits', 'user_key']).default('user_key'),
  input: z.record(z.string(), z.unknown()).default({}),
  workflowId: z.string().optional(),
  nodeId: z.string().optional(),
})

export type SubmitTaskInput = z.infer<typeof submitTaskSchema>

/* ─── List Tasks ────────────────────────────────────── */

export const listTasksSchema = z.object({
  status: z
    .enum(['pending', 'running', 'completed', 'failed', 'cancelled'])
    .optional(),
  taskType: z.enum(['video_gen', 'image_gen', 'audio_gen']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type ListTasksInput = z.infer<typeof listTasksSchema>
