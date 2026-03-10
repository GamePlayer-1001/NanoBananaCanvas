/**
 * [INPUT]: 依赖 ./types 的 TaskProcessor 接口，依赖 @/lib/logger，依赖 @/lib/env
 * [OUTPUT]: 对外提供 ImageGenProcessor 类 (OpenRouter + Gemini 图片生成)
 * [POS]: lib/tasks/processors 的图片生成处理器，按 provider 分发到 OpenRouter 或 Gemini Imagen
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'

import type { CheckResult, SubmitInput, SubmitResult, TaskProcessor } from './types'

const log = createLogger('processor:image-gen')

/* ─── OpenRouter Image API ───────────────────────────── */

async function openrouterSubmit(
  input: SubmitInput,
  apiKey: string,
): Promise<{ url: string }> {
  const { model, params } = input
  const prompt = (params.prompt as string) ?? ''
  const size = (params.size as string) ?? '1024x1024'

  const res = await fetch('https://openrouter.ai/api/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, size, n: 1 }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenRouter image API ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { data?: Array<{ url?: string }> }
  const url = data.data?.[0]?.url
  if (!url) throw new Error('OpenRouter returned no image URL')
  return { url }
}

/* ─── Gemini Imagen API ──────────────────────────────── */

async function geminiSubmit(
  input: SubmitInput,
  apiKey: string,
): Promise<{ url: string }> {
  const { model, params } = input
  const prompt = (params.prompt as string) ?? ''

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1 },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gemini Imagen API ${res.status}: ${text}`)
  }

  const data = (await res.json()) as {
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>
  }

  const b64 = data.predictions?.[0]?.bytesBase64Encoded
  if (!b64) throw new Error('Gemini Imagen returned no image data')

  const mime = data.predictions?.[0]?.mimeType ?? 'image/png'
  return { url: `data:${mime};base64,${b64}` }
}

/* ─── Processor ──────────────────────────────────────── */

export class ImageGenProcessor implements TaskProcessor {
  readonly taskType = 'image_gen' as const
  readonly provider: string

  constructor(provider: string) {
    this.provider = provider
  }

  async submit(input: SubmitInput, apiKey: string): Promise<SubmitResult> {
    log.info('Image gen submit', { model: input.model, provider: this.provider })

    let result: { url: string }

    switch (this.provider) {
      case 'openrouter':
        result = await openrouterSubmit(input, apiKey)
        break
      case 'gemini':
        result = await geminiSubmit(input, apiKey)
        break
      default:
        throw new Error(`Provider "${this.provider}" not supported for image_gen`)
    }

    // 图片生成是同步的 — 直接用 URL 作为 externalTaskId，checkStatus 返回 completed
    return {
      externalTaskId: result.url,
      initialStatus: 'running',
    }
  }

  async checkStatus(externalTaskId: string, _apiKey: string): Promise<CheckResult> {
    // 同步 Provider: submit 完成即代表 completed，URL 存在 externalTaskId 中
    log.debug('Image gen checkStatus (sync)', { provider: this.provider })
    return {
      status: 'completed',
      progress: 100,
      result: {
        type: 'url',
        url: externalTaskId,
        contentType: 'image/png',
      },
    }
  }

  async cancel(_externalTaskId: string, _apiKey: string): Promise<void> {
    log.info('Image gen cancel (noop)', { provider: this.provider })
  }
}
