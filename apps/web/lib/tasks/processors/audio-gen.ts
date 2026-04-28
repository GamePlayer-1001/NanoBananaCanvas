/**
 * [INPUT]: 依赖 ./types 的 TaskProcessor 接口，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 AudioGenProcessor 类 (OpenAI TTS 实现)
 * [POS]: lib/tasks/processors 的音频生成处理器，通过 OpenAI TTS API 合成语音
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'

import type { CheckResult, SubmitInput, SubmitResult, TaskProcessor } from './types'

const log = createLogger('processor:audio-gen')

/* ─── OpenAI TTS endpoint ────────────────────────────── */

const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech'

/* ─── Processor ──────────────────────────────────────── */

export class AudioGenProcessor implements TaskProcessor {
  readonly taskType = 'audio_gen' as const
  readonly provider: string

  constructor(provider: string) {
    this.provider = provider
  }

  async submit(input: SubmitInput, apiKey: string): Promise<SubmitResult> {
    log.info('Audio gen submit', { model: input.model, provider: this.provider })

    if (this.provider !== 'openai' && this.provider !== 'openai-compatible') {
      throw new Error(`Provider "${this.provider}" not supported for audio_gen`)
    }

    const result = await openaiTTSSubmit(input, apiKey, this.provider)

    return {
      externalTaskId: null,
      initialStatus: 'completed',
      result: {
        type: 'url',
        url: result.dataUrl,
        contentType: 'audio/mpeg',
      },
    }
  }

  async checkStatus(externalTaskId: string, _apiKey: string): Promise<CheckResult> {
    // 同步 Provider: submit 时已完成
    void _apiKey
    return {
      status: 'completed',
      progress: 100,
      result: {
        type: 'url',
        url: externalTaskId,
        contentType: 'audio/mpeg',
      },
    }
  }

  async cancel(_externalTaskId: string, _apiKey: string): Promise<void> {
    void _externalTaskId
    void _apiKey
    log.info('Audio gen cancel (noop — synchronous provider)')
  }
}

/* ─── OpenAI TTS API ─────────────────────────────────── */

async function openaiTTSSubmit(
  input: SubmitInput,
  apiKey: string,
  provider: string,
): Promise<{ dataUrl: string }> {
  const { model, params } = input
  const text = params.text as string
  const voice = (params.voice as string) ?? 'alloy'
  const speed = (params.speed as number) ?? 1.0
  const baseUrl =
    typeof params.baseUrl === 'string' ? params.baseUrl.trim().replace(/\/+$/, '') : ''

  if (!text) throw new Error('Text input is required for TTS')
  if (!apiKey) throw new Error('OpenAI API key is required for TTS')
  if (provider === 'openai-compatible' && !baseUrl) {
    throw new Error('OpenAI-compatible audio provider requires baseUrl')
  }

  const endpoint =
    provider === 'openai-compatible' ? `${baseUrl}/audio/speech` : OPENAI_TTS_URL

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      speed,
      response_format: 'mp3',
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    log.error('OpenAI TTS API error', { status: res.status, body: errorBody })
    throw new Error(`OpenAI TTS API error: ${res.status} ${res.statusText}`)
  }

  // 将二进制音频转为 base64 data URL
  const arrayBuffer = await res.arrayBuffer()
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
  )

  return { dataUrl: `data:audio/mpeg;base64,${base64}` }
}
