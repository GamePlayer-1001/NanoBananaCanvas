/**
 * [INPUT]: 依赖 zod
 * [OUTPUT]: 对外提供 aiExecuteSchema / apiKeySchema / modelsQuerySchema
 * [POS]: lib/validations 的 AI 执行验证，被 ai API 路由消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

/* ─── AI 执行请求 ────────────────────────────────────── */

const capabilitySchema = z.enum(['text', 'image', 'video', 'audio'])
const imageSizePresetSchema = z.enum(['720p', '1k', '2k', '4k', '8k'])
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

const contentPartSchema = z.union([
  z.object({
    type: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('image_url'),
    image_url: z.object({
      url: z.string().min(1),
    }),
  }),
])

export const aiExecuteSchema = z
  .object({
    provider: z.string().trim().min(1).optional(),
    capability: capabilitySchema.optional(),
    modelId: z.string().trim().min(1).optional(),
    configId: z.string().trim().min(1).optional(),
    messages: z
      .array(
        z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.union([z.string(), z.array(contentPartSchema).min(1)]),
        }),
      )
      .min(1),
    executionMode: z.enum(['platform', 'user_key']).default('platform'),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(32768).optional(),
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
    }

    if (value.executionMode === 'user_key' && !value.capability) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['capability'],
        message: 'User key execution requires capability',
      })
    }
  })

/* ─── API Key 管理 ───────────────────────────────────── */

export const apiKeySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  apiKey: z.string().trim().optional(),
  secretKey: z.string().trim().optional(),
  baseUrl: z.string().trim().url('Base URL must be a valid URL').optional(),
  modelId: z.string().min(1, 'Model ID is required'),
  capability: z.enum(['text', 'image', 'video', 'audio']),
  configId: z.string().trim().min(1).optional(),
  providerKind: z.enum([
    'openai-compatible',
    'google-image',
    'gemini',
    'kling',
    'openai-audio',
  ]),
  providerId: z.string().min(1, 'Provider ID is required'),
  label: z.string().max(100).optional(),
  imageCapabilities: imageCapabilitiesSchema,
})

/* ─── 模型列表查询 ───────────────────────────────────── */

export const modelsQuerySchema = z.object({
  category: z.enum(['text', 'image', 'video', 'audio']).optional(),
})
