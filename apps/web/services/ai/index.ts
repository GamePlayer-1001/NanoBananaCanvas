/**
 * [INPUT]: 依赖 ./provider, ./openrouter, ./deepseek, ./gemini
 * [OUTPUT]: 对外提供 getProvider / getPlatformKey / getAllModelGroups 的统一入口
 * [POS]: services/ai 的桶文件 + Provider 初始化入口，确保 import 时自动注册
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getAllModelGroups, getAllProviders, getPlatformKey, getProvider, registerModelGroup, registerProvider } from './provider'
import { DeepSeekClient, DEEPSEEK_MODELS } from './deepseek'
import { GeminiClient, GEMINI_MODELS } from './gemini'
import { OpenRouterClient, OPENROUTER_MODELS } from './openrouter'

/* ─── Auto-register Providers ────────────────────────── */

registerProvider(new OpenRouterClient())
registerProvider(new DeepSeekClient())
registerProvider(new GeminiClient())

/* ─── Auto-register Model Groups ─────────────────────── */

const ALL_MODEL_GROUPS = [...OPENROUTER_MODELS, ...DEEPSEEK_MODELS, ...GEMINI_MODELS]

for (const group of ALL_MODEL_GROUPS) {
  registerModelGroup(group)
}

/* ─── Re-export ──────────────────────────────────────── */

export { getProvider, getPlatformKey, getAllModelGroups, getAllProviders }
export type { AIProvider, ChatParams, ChatResult, ChatStreamParams, ModelGroup, ModelOption } from './types'
