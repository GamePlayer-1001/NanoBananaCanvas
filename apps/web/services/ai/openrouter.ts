/**
 * [INPUT]: 依赖 @/lib/errors 的 AIServiceError/ErrorCode，依赖 @/lib/logger 的 createLogger
 * [OUTPUT]: 对外提供 OpenRouterClient 类 (chat / chatStream / validateKey)
 * [POS]: services/ai 的核心 API 客户端，被 LLMNode 执行引擎消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { AIServiceError, ErrorCode } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import type {
  ChatParams,
  ChatRequest,
  ChatResponse,
  ChatStreamParams,
  StreamChunk,
} from './types'

const log = createLogger('OpenRouter')

/* ─── Constants ──────────────────────────────────────── */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

const HEADERS_BASE = {
  'Content-Type': 'application/json',
  'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
  'X-Title': 'Nano Banana Canvas',
} as const

/* ─── Client ─────────────────────────────────────────── */

export class OpenRouterClient {
  /* ── Single-shot chat ─────────────────────────────── */

  async chat(params: ChatParams): Promise<string> {
    const { model, messages, temperature, maxTokens, apiKey, signal } = params

    const body: ChatRequest = {
      model,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 1024,
      stream: false,
    }

    log.debug('Chat request', { model, messageCount: messages.length })

    const res = await this.fetchWithErrorHandling(body, apiKey, signal)
    const data = (await res.json()) as ChatResponse

    if (!data.choices?.[0]?.message?.content) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Empty response from model', {
        model,
        response: data,
      })
    }

    const content = data.choices[0].message.content
    log.debug('Chat response', { model, length: content.length })
    return content
  }

  /* ── Streaming chat ───────────────────────────────── */

  async chatStream(params: ChatStreamParams): Promise<string> {
    const { model, messages, temperature, maxTokens, apiKey, signal, onChunk } = params

    const body: ChatRequest = {
      model,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 1024,
      stream: true,
    }

    log.debug('Stream request', { model, messageCount: messages.length })

    const res = await this.fetchWithErrorHandling(body, apiKey, signal)

    if (!res.body) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Response body is null', { model })
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // 保留最后一个可能不完整的行
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const payload = trimmed.slice(6)
          if (payload === '[DONE]') continue

          try {
            const chunk = JSON.parse(payload) as StreamChunk
            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) {
              fullText += delta
              onChunk(delta)
            }
          } catch {
            // 跳过无法解析的 SSE 行
            log.warn('Failed to parse SSE chunk', { payload })
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    log.debug('Stream complete', { model, length: fullText.length })
    return fullText
  }

  /* ── API Key Validation ───────────────────────────── */

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      return res.ok
    } catch {
      return false
    }
  }

  /* ── Internal ─────────────────────────────────────── */

  private async fetchWithErrorHandling(
    body: ChatRequest,
    apiKey: string,
    signal?: AbortSignal,
  ): Promise<Response> {
    if (!apiKey) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'API key is required', {})
    }

    let res: Response

    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          ...HEADERS_BASE,
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal,
      })
    } catch (err) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Network request failed', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error')

      if (res.status === 401) {
        throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Invalid API key', {
          status: res.status,
        })
      }
      if (res.status === 429) {
        throw new AIServiceError(ErrorCode.AI_RATE_LIMITED, 'Rate limited by OpenRouter', {
          status: res.status,
        })
      }
      if (res.status === 402) {
        throw new AIServiceError(ErrorCode.AI_QUOTA_EXCEEDED, 'Quota exceeded', {
          status: res.status,
        })
      }

      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, `API error: ${res.status}`, {
        status: res.status,
        body: errorBody,
      })
    }

    return res
  }
}

/* ─── Singleton ──────────────────────────────────────── */

export const openRouter = new OpenRouterClient()
