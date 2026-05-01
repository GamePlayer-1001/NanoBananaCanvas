/**
 * [INPUT]: 依赖 zod 的 z
 * [OUTPUT]: 对外提供 submitTaskSchema, listTasksSchema, deleteTasksSchema
 * [POS]: lib/validations 的异步任务请求验证，被 /api/tasks 端点消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

/* ─── Submit Task ───────────────────────────────────── */

const capabilitySchema = z.enum(['text', 'image', 'video', 'audio'])
const imageSizePresetSchema = z.enum(['1k', '2k', '4k', '8k'])
const imageAspectRatioSchema = z.enum(['1:1', '2:3', '3:2', '9:16', '16:9'])

const imageCapabilitiesSchema = z
  .object({
    minPixels: z.coerce.number().int().positive().optional(),
    maxPixels: z.coerce.number().int().positive().optional(),
    maxLongEdge: z.coerce.number().int().positive().optional(),
    allowedSizes: z.array(imageSizePresetSchema).optional(),
    allowedAspectRatios: z.array(imageAspectRatioSchema).optional(),
  })
  .optional()

function matchesTaskType(provider: string, modelId: string, taskType: 'image_gen' | 'video_gen' | 'audio_gen') {
  const normalizedProvider = provider.toLowerCase()
  const normalizedModel = modelId.toLowerCase()

  if (taskType === 'image_gen') {
    return (
      normalizedProvider === 'dlapi' ||
      normalizedModel.includes('image') ||
      normalizedModel.includes('dall-e') ||
      normalizedModel.includes('imagen') ||
      normalizedModel.includes('flux') ||
      normalizedModel.includes('sd-')
    )
  }

  if (taskType === 'video_gen') {
    return (
      normalizedProvider === 'kling' ||
      normalizedModel.includes('video') ||
      normalizedModel.includes('veo') ||
      normalizedModel.includes('kling')
    )
  }

  return (
    normalizedModel.includes('audio') ||
    normalizedModel.includes('speech') ||
    normalizedModel.includes('tts')
  )
}

export const submitTaskSchema = z
  .object({
    taskType: z.enum(['video_gen', 'image_gen', 'audio_gen']),
    provider: z.string().trim().min(1).optional(),
    capability: capabilitySchema.optional(),
    modelId: z.string().trim().min(1).optional(),
    configId: z.string().trim().min(1).optional(),
    executionMode: z.enum(['platform', 'user_key']).default('user_key'),
    input: z.record(z.string(), z.unknown()).default({}),
    workflowId: z.string().optional(),
    nodeId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.executionMode === 'platform') {
      if (!value.provider) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['provider'],
          message: 'Platform execution requires provider',
        })
      }

      if (!value.modelId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['modelId'],
          message: 'Platform execution requires modelId',
        })
      }

      if (value.provider && value.modelId && !matchesTaskType(value.provider, value.modelId, value.taskType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['modelId'],
          message: `Platform model does not support task type: ${value.taskType}`,
        })
      }
    }

    if (value.executionMode === 'user_key' && !value.capability) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['capability'],
        message: 'User key execution requires capability',
      })
    }

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

/* ─── Delete Tasks ──────────────────────────────────── */

export const deleteTasksSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(100),
})

export type DeleteTasksInput = z.infer<typeof deleteTasksSchema>
