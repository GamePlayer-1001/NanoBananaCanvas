/**
 * [INPUT]: 依赖 ./provider, ./openrouter, ./deepseek, ./gemini, ./platform
 * [OUTPUT]: 对外提供 getProvider / getPlatformKey / getAllProviders / 平台运行时解析入口
 * [POS]: services/ai 的桶文件 + Provider 初始化入口，确保 import 时自动注册
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getAllProviders, getPlatformKey, getProvider, registerProvider } from './provider'
import { DeepSeekClient } from './deepseek'
import { GeminiClient } from './gemini'
import { OpenRouterClient } from './openrouter'
import {
  createPlatformTextProvider,
  getPlatformSupplierApiKey,
  getPlatformSupplierBaseUrl,
} from './platform'

/* ─── Auto-register Providers ────────────────────────── */

registerProvider(new OpenRouterClient())
registerProvider(new DeepSeekClient())
registerProvider(new GeminiClient())

/* ─── Re-export ──────────────────────────────────────── */

export {
  createPlatformTextProvider,
  getAllProviders,
  getPlatformKey,
  getPlatformSupplierApiKey,
  getPlatformSupplierBaseUrl,
  getProvider,
}
export type { AIProvider, ChatParams, ChatResult, ChatStreamParams, ModelGroup, ModelOption } from './types'
