/**
 * [INPUT]: 依赖 ./types 的 AIProvider 接口，依赖 @/lib/env 的 requireEnv
 * [OUTPUT]: 对外提供 registerProvider / getProvider / getPlatformKey / getAllModelGroups
 * [POS]: services/ai 的注册中心，统一路由 provider-id → AIProvider 实例
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireEnv } from '@/lib/env'

import type { AIProvider, ModelGroup } from './types'

/* ─── Registry ───────────────────────────────────────── */

const providers = new Map<string, AIProvider>()

export function registerProvider(provider: AIProvider): void {
  providers.set(provider.id, provider)
}

export function getProvider(id: string): AIProvider {
  const p = providers.get(id)
  if (!p) throw new Error(`Unknown AI provider: ${id}`)
  return p
}

export function getAllProviders(): AIProvider[] {
  return Array.from(providers.values())
}

/* ─── Platform Key Mapping ───────────────────────────── */

const PLATFORM_KEY_MAP: Record<string, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  gemini: 'GEMINI_API_KEY',
}

/**
 * 获取指定 Provider 的平台 API Key
 * 从环境变量中读取，不存在则抛出错误
 */
export async function getPlatformKey(providerId: string): Promise<string> {
  const envKey = PLATFORM_KEY_MAP[providerId]
  if (!envKey) throw new Error(`No platform key mapping for provider: ${providerId}`)
  return requireEnv(envKey)
}

/* ─── Model Groups (前端展示用) ──────────────────────── */

/** 各 Provider 静态声明的模型列表 — 用于 LLMNode 下拉选择 */
const modelGroups: ModelGroup[] = []

export function registerModelGroup(group: ModelGroup): void {
  modelGroups.push(group)
}

export function getAllModelGroups(): ModelGroup[] {
  return modelGroups
}
