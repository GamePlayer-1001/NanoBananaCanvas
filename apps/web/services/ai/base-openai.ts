/**
 * [INPUT]: 依赖 ./types 的 AIProvider/ChatParams/ChatResult 等，依赖 @/lib/errors, @/lib/logger
 * [OUTPUT]: 对外提供 BaseOpenAICompatible 抽象基类
 * [POS]: services/ai 的 OpenAI 兼容 Provider 基类，被 OpenRouter/DeepSeek 继承复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { AIServiceError, ErrorCode } from '@/lib/errors'
import { createLogger } from '@/lib/logger'

import type {
  AIProvider,
  ChatParams,
  ChatRequest,
  ChatResponse,
  ChatResult,
  ChatStreamParams,
  StreamChunk,
} from './types'

/* ─── Abstract Base ──────────────────────────────────── */

/**
 * OpenAI 兼容 API 的通用基类
 * 子类只需提供: id, name, endpoint, headers, validateEndpoint
 */
export abstract class BaseOpenAICompatible implements AIProvider {
  abstract readonly id: string
  abstract readonly name: string

  protected abstract readonly endpoint: string
  protected abstract readonly validateEndpoint: string
  protected readonly log = createLogger(`AI:${this.constructor.name}`)

  /** 子类可覆盖，添加 Provider 特有的请求头 */
  protected buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    }
  }

  /* ── Single-shot chat ─────────────────────────────── */

  async chat(params: ChatParams): Promise<ChatResult> {
    const { model, messages, temperature, maxTokens, apiKey, signal } = params

    const body: ChatRequest = {
      model,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 1024,
      stream: false,
    }

    this.log.debug('Chat request', { model, messageCount: messages.length })

    const res = await this.fetchWithErrorHandling(body, apiKey, signal)
    const rawText = await res.text()
    let data: ChatResponse

    try {
      data = JSON.parse(rawText) as ChatResponse
    } catch {
      throw new AIServiceError(
        ErrorCode.AI_PROVIDER_ERROR,
        'Provider returned a non-JSON response',
        {
          model,
          provider: this.id,
          bodyPreview: rawText.slice(0, 300),
        },
      )
    }

    if (!data.choices?.[0]?.message?.content) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Empty response from model', {
        model,
        provider: this.id,
        bodyPreview: rawText.slice(0, 300),
      })
    }

    const content = data.choices[0].message.content as string
    this.log.debug('Chat response', { model, length: content.length })

    return {
      content,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    }
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

    this.log.debug('Stream request', { model, messageCount: messages.length })

    const res = await this.fetchWithErrorHandling(body, apiKey, signal)

    if (!res.body) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Response body is null', {
        model,
        provider: this.id,
      })
    }

    return this.parseSSEStream(res.body, onChunk, model)
  }

  /* ── API Key Validation ───────────────────────────── */

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(this.validateEndpoint, {
        headers: this.buildHeaders(apiKey),
      })
      return res.ok
    } catch {
      return false
    }
  }

  /* ── SSE Stream Parser ────────────────────────────── */

  protected async parseSSEStream(
    body: ReadableStream<Uint8Array>,
    onChunk: (text: string) => void,
    model: string,
  ): Promise<string> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
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
            this.log.warn('Failed to parse SSE chunk', { payload: payload.slice(0, 100) })
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    this.log.debug('Stream complete', { model, length: fullText.length })
    return fullText
  }

  /* ── Fetch with Error Handling ─────────────────────── */

  protected async fetchWithErrorHandling(
    body: ChatRequest,
    apiKey: string,
    signal?: AbortSignal,
  ): Promise<Response> {
    if (!apiKey) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'API key is required', {
        provider: this.id,
      })
    }

    let res: Response

    try {
      res = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.buildHeaders(apiKey),
        body: JSON.stringify(body),
        signal,
      })
    } catch (err) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Network request failed', {
        provider: this.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error')

      if (res.status === 401) {
        throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Invalid API key', {
          provider: this.id,
          status: res.status,
        })
      }
      if (res.status === 429) {
        throw new AIServiceError(ErrorCode.AI_RATE_LIMITED, 'Rate limited', {
          provider: this.id,
          status: res.status,
        })
      }
      if (res.status === 402) {
        throw new AIServiceError(ErrorCode.AI_QUOTA_EXCEEDED, 'Quota exceeded', {
          provider: this.id,
          status: res.status,
        })
      }

      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, `API error: ${res.status}`, {
        provider: this.id,
        status: res.status,
        body: errorBody.slice(0, 500),
      })
    }

    return res
  }
}
