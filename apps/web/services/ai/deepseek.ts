/**
 * [INPUT]: 依赖 ./base-openai 的 BaseOpenAICompatible 基类，依赖 ./types
 * [OUTPUT]: 对外提供 DeepSeekClient (AIProvider 实现) + DEEPSEEK_MODELS
 * [POS]: services/ai 的 DeepSeek Provider，通过 index.ts 注册
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { BaseOpenAICompatible } from './base-openai'
import type { ModelGroup } from './types'

/* ─── DeepSeek Provider ─────────────────────────────── */

export class DeepSeekClient extends BaseOpenAICompatible {
  readonly id = 'deepseek'
  readonly name = 'DeepSeek'

  protected readonly endpoint = 'https://api.deepseek.com/v1/chat/completions'
  protected readonly validateEndpoint = 'https://api.deepseek.com/v1/models'
}

/* ─── Model Catalog ─────────────────────────────────── */

export const DEEPSEEK_MODELS: ModelGroup[] = [
  {
    provider: 'deepseek',
    providerName: 'DeepSeek',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat' },
      { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    ],
  },
]
