/**
 * [INPUT]: 依赖 ./provider, ./openrouter, ./deepseek, ./gemini
 * [OUTPUT]: 对外提供 getProvider / getPlatformKey / getAllProviders 的统一入口
 * [POS]: services/ai 的桶文件 + Provider 初始化入口，确保 import 时自动注册
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getAllProviders, getPlatformKey, getProvider, registerProvider } from './provider'
import { DeepSeekClient } from './deepseek'
import { GeminiClient } from './gemini'
import { OpenRouterClient } from './openrouter'

/* ─── Auto-register Providers ────────────────────────── */

registerProvider(new OpenRouterClient())
registerProvider(new DeepSeekClient())
registerProvider(new GeminiClient())

/* ─── Re-export ──────────────────────────────────────── */

export { getProvider, getPlatformKey, getAllProviders }
export type { AIProvider, ChatParams, ChatResult, ChatStreamParams, ModelGroup, ModelOption } from './types'
