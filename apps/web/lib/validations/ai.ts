/**
 * [INPUT]: 依赖 zod
 * [OUTPUT]: 对外提供 aiExecuteSchema / apiKeySchema / modelsQuerySchema
 * [POS]: lib/validations 的 AI 执行验证，被 ai API 路由消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

/* ─── AI 执行请求 ────────────────────────────────────── */

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

export const aiExecuteSchema = z.object({
  provider: z.string().min(1),
  modelId: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.union([z.string(), z.array(contentPartSchema).min(1)]),
    }),
  ).min(1),
  executionMode: z.enum(['platform', 'user_key']).default('platform'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32768).optional(),
  workflowId: z.string().optional(),
  nodeId: z.string().optional(),
})

/* ─── API Key 管理 ───────────────────────────────────── */

export const apiKeySchema = z.object({
  apiKey: z.string().trim().optional(),
  secretKey: z.string().trim().optional(),
  baseUrl: z.string().trim().url('Base URL must be a valid URL').optional(),
  modelId: z.string().min(1, 'Model ID is required'),
  providerKind: z.enum([
    'openai-compatible',
    'google-image',
    'gemini',
    'kling',
    'openai-audio',
  ]),
  providerId: z.string().min(1, 'Provider ID is required'),
  label: z.string().max(100).optional(),
})

/* ─── 模型列表查询 ───────────────────────────────────── */

export const modelsQuerySchema = z.object({
  category: z.enum(['text', 'image', 'video', 'audio']).optional(),
})
