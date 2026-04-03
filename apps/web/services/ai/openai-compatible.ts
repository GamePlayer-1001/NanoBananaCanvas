/**
 * [INPUT]: 依赖 ./base-openai 的 BaseOpenAICompatible 基类
 * [OUTPUT]: 对外提供 OpenAICompatibleClient 动态 Provider (自定义 baseUrl)
 * [POS]: services/ai 的通用 OpenAI 兼容客户端，被账号级自定义 URL + model 配置消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { BaseOpenAICompatible } from './base-openai'
import { normalizeOpenAIBaseUrl } from '@/lib/user-model-config'

export class OpenAICompatibleClient extends BaseOpenAICompatible {
  readonly id = 'openai-compatible'
  readonly name = 'OpenAI Compatible'

  protected readonly endpoint: string
  protected readonly validateEndpoint: string

  constructor(baseUrl: string) {
    super()
    const normalized = normalizeOpenAIBaseUrl(baseUrl)
    this.endpoint = `${normalized}/chat/completions`
    this.validateEndpoint = `${normalized}/models`
  }
}
