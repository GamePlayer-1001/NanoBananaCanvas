/**
 * [INPUT]: 依赖 ./base-openai 的 BaseOpenAICompatible 基类，依赖 ./types
 * [OUTPUT]: 对外提供 OpenRouterClient (AIProvider 实现) + OPENROUTER_MODELS
 * [POS]: services/ai 的 OpenRouter Provider，通过 provider.ts 注册
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { BaseOpenAICompatible } from './base-openai'
import type { ModelGroup } from './types'

/* ─── OpenRouter Provider ───────────────────────────── */

export class OpenRouterClient extends BaseOpenAICompatible {
  readonly id = 'openrouter'
  readonly name = 'OpenRouter'

  protected readonly endpoint = 'https://openrouter.ai/api/v1/chat/completions'
  protected readonly validateEndpoint = 'https://openrouter.ai/api/v1/models'

  protected override buildHeaders(apiKey: string): Record<string, string> {
    const browserWindow = 'window' in globalThis
      ? (globalThis as typeof globalThis & {
          window?: { location?: { origin?: string } }
        }).window
      : undefined

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': browserWindow?.location?.origin ?? '',
      'X-Title': 'Nano Banana Canvas',
    }
  }
}

/* ─── Model Catalog ─────────────────────────────────── */

export const OPENROUTER_MODELS: ModelGroup[] = [
  {
    provider: 'openrouter',
    providerName: 'OpenAI',
    models: [
      { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
    ],
  },
  {
    provider: 'openrouter',
    providerName: 'Anthropic',
    models: [
      { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet' },
      { value: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku' },
    ],
  },
]
