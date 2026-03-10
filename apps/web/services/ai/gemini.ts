/**
 * [INPUT]: 依赖 ./types 的 AIProvider 接口和核心类型，依赖 @/lib/errors, @/lib/logger
 * [OUTPUT]: 对外提供 GeminiClient (AIProvider 实现) + GEMINI_MODELS
 * [POS]: services/ai 的 Google Gemini Provider，独立实现 (非 OpenAI 兼容)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { AIServiceError, ErrorCode } from '@/lib/errors'
import { createLogger } from '@/lib/logger'

import type { AIProvider, ChatParams, ChatResult, ChatStreamParams, ModelGroup } from './types'

const log = createLogger('AI:Gemini')

/* ─── Constants ──────────────────────────────────────── */

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

/* ─── Gemini-specific Types ──────────────────────────── */

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } } | { file_data: { mime_type: string; file_uri: string } }

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

interface GeminiResponse {
  candidates?: {
    content: { parts: { text: string }[] }
    finishReason: string
  }[]
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

/* ─── Gemini Provider ───────────────────────────────── */

export class GeminiClient implements AIProvider {
  readonly id = 'gemini'
  readonly name = 'Google Gemini'

  /* ── Single-shot chat ─────────────────────────────── */

  async chat(params: ChatParams): Promise<ChatResult> {
    const { model, messages, temperature, maxTokens, apiKey } = params

    const url = `${BASE_URL}/models/${model}:generateContent?key=${apiKey}`
    const body = this.buildRequestBody(messages, temperature, maxTokens)

    log.debug('Chat request', { model, messageCount: messages.length })

    const res = await this.fetchWithErrorHandling(url, body)
    const data = (await res.json()) as GeminiResponse

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Empty response from Gemini', {
        model,
        provider: this.id,
      })
    }

    log.debug('Chat response', { model, length: text.length })

    return {
      content: text,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    }
  }

  /* ── Streaming chat ───────────────────────────────── */

  async chatStream(params: ChatStreamParams): Promise<string> {
    const { model, messages, temperature, maxTokens, apiKey, onChunk } = params

    const url = `${BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
    const body = this.buildRequestBody(messages, temperature, maxTokens)

    log.debug('Stream request', { model, messageCount: messages.length })

    const res = await this.fetchWithErrorHandling(url, body)

    if (!res.body) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Response body is null', {
        model,
        provider: this.id,
      })
    }

    return this.parseGeminiSSE(res.body, onChunk, model)
  }

  /* ── API Key Validation ───────────────────────────── */

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/models?key=${apiKey}`)
      return res.ok
    } catch {
      return false
    }
  }

  /* ── Request Builder ──────────────────────────────── */

  private buildRequestBody(
    messages: ChatParams['messages'],
    temperature?: number,
    maxTokens?: number,
  ) {
    // Gemini 格式转换: system → systemInstruction, user/assistant → contents
    let systemInstruction: { parts: { text: string }[] } | undefined
    const contents: GeminiContent[] = []

    for (const msg of messages) {
      const parts = this.contentToParts(msg.content)

      if (msg.role === 'system') {
        systemInstruction = { parts: parts.filter((p): p is { text: string } => 'text' in p) }
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts,
        })
      }
    }

    return {
      ...(systemInstruction && { systemInstruction }),
      contents,
      generationConfig: {
        temperature: temperature ?? 0.7,
        maxOutputTokens: maxTokens ?? 1024,
      },
    }
  }

  /* ── Content → Gemini Parts 转换 ──────────────────── */

  private contentToParts(content: string | import('./types').ContentPart[]): GeminiPart[] {
    if (typeof content === 'string') {
      return [{ text: content }]
    }

    return content.map((part) => {
      if (part.type === 'text') return { text: part.text }
      if (part.type === 'image_url') {
        const url = part.image_url.url
        /* base64 data URI → inline_data */
        if (url.startsWith('data:')) {
          const match = url.match(/^data:([^;]+);base64,(.+)$/)
          if (match) return { inline_data: { mime_type: match[1], data: match[2] } }
        }
        /* HTTP URL → file_data */
        return { file_data: { mime_type: 'image/jpeg', file_uri: url } }
      }
      return { text: '' }
    })
  }

  /* ── SSE Parser (Gemini 格式) ─────────────────────── */

  private async parseGeminiSSE(
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

          try {
            const chunk = JSON.parse(payload) as GeminiResponse
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              fullText += text
              onChunk(text)
            }
          } catch {
            log.warn('Failed to parse Gemini SSE chunk', { payload: payload.slice(0, 100) })
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    log.debug('Stream complete', { model, length: fullText.length })
    return fullText
  }

  /* ── Fetch with Error Handling ─────────────────────── */

  private async fetchWithErrorHandling(url: string, body: unknown): Promise<Response> {
    let res: Response

    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (err) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Network request failed', {
        provider: this.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error')

      if (res.status === 400) {
        throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Invalid request to Gemini', {
          provider: this.id,
          status: res.status,
          body: errorBody.slice(0, 500),
        })
      }
      if (res.status === 403) {
        throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Invalid API key', {
          provider: this.id,
          status: res.status,
        })
      }
      if (res.status === 429) {
        throw new AIServiceError(ErrorCode.AI_RATE_LIMITED, 'Rate limited by Gemini', {
          provider: this.id,
          status: res.status,
        })
      }

      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, `Gemini API error: ${res.status}`, {
        provider: this.id,
        status: res.status,
        body: errorBody.slice(0, 500),
      })
    }

    return res
  }
}

/* ─── Model Catalog ─────────────────────────────────── */

export const GEMINI_MODELS: ModelGroup[] = [
  {
    provider: 'gemini',
    providerName: 'Google',
    models: [
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { value: 'gemini-2.5-pro-preview-06-05', label: 'Gemini 2.5 Pro' },
    ],
  },
]
