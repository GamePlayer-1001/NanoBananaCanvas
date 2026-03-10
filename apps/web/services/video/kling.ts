/**
 * [INPUT]: 依赖 @/lib/logger，依赖 @/lib/env
 * [OUTPUT]: 对外提供 KlingClient 类 (可灵 AI 视频生成 API 客户端)
 * [POS]: services/video 的可灵 Provider，被 VideoGenProcessor 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'

const log = createLogger('kling')

const BASE_URL = 'https://api.klingai.com/v1'

/* ─── Types ──────────────────────────────────────────── */

export interface KlingConfig {
  accessKey: string
  secretKey: string
}

export interface KlingTextToVideoParams {
  model: string
  prompt: string
  negativePrompt?: string
  duration: '5' | '10'
  aspectRatio: '16:9' | '9:16' | '1:1'
  mode: 'std' | 'pro'
}

export interface KlingImageToVideoParams {
  model: string
  imageUrl: string
  prompt?: string
  duration: '5' | '10'
}

export interface KlingTaskResult {
  taskId: string
  taskStatus: 'submitted' | 'processing' | 'succeed' | 'failed'
  taskStatusMsg?: string
  videos?: Array<{
    id: string
    url: string
    duration: string
  }>
}

/* ─── JWT Generation ─────────────────────────────────── */

async function generateJWT(accessKey: string, secretKey: string): Promise<string> {
  // JWT Header
  const header = { alg: 'HS256', typ: 'JWT' }

  // JWT Payload (valid 30 min)
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: accessKey,
    exp: now + 1800,
    nbf: now - 5,
  }

  const enc = new TextEncoder()

  const b64url = (buf: ArrayBuffer | Uint8Array): string => {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
    let binary = ''
    for (const b of bytes) binary += String.fromCharCode(b)
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  const headerB64 = b64url(enc.encode(JSON.stringify(header)))
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)))
  const signingInput = `${headerB64}.${payloadB64}`

  // HMAC-SHA256 sign
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput))
  const signatureB64 = b64url(signature)

  return `${signingInput}.${signatureB64}`
}

/* ─── Client ─────────────────────────────────────────── */

export class KlingClient {
  private readonly accessKey: string
  private readonly secretKey: string

  constructor(config: KlingConfig) {
    this.accessKey = config.accessKey
    this.secretKey = config.secretKey
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await generateJWT(this.accessKey, this.secretKey)
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  }

  /* ── Text to Video ───────────────────────────────── */

  async textToVideo(params: KlingTextToVideoParams): Promise<string> {
    const headers = await this.authHeaders()
    const res = await fetch(`${BASE_URL}/videos/text2video`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model_name: params.model,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt ?? '',
        cfg_scale: 0.5,
        mode: params.mode,
        duration: params.duration,
        aspect_ratio: params.aspectRatio,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Kling text2video ${res.status}: ${text}`)
    }

    const data = (await res.json()) as { data?: { task_id?: string } }
    const taskId = data.data?.task_id
    if (!taskId) throw new Error('Kling returned no task_id')

    log.info('Kling text2video submitted', { taskId })
    return taskId
  }

  /* ── Image to Video ──────────────────────────────── */

  async imageToVideo(params: KlingImageToVideoParams): Promise<string> {
    const headers = await this.authHeaders()
    const res = await fetch(`${BASE_URL}/videos/image2video`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model_name: params.model,
        image: params.imageUrl,
        prompt: params.prompt ?? '',
        duration: params.duration,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Kling image2video ${res.status}: ${text}`)
    }

    const data = (await res.json()) as { data?: { task_id?: string } }
    const taskId = data.data?.task_id
    if (!taskId) throw new Error('Kling returned no task_id')

    log.info('Kling image2video submitted', { taskId })
    return taskId
  }

  /* ── Query Task Status ───────────────────────────── */

  async getTaskStatus(taskId: string): Promise<KlingTaskResult> {
    const headers = await this.authHeaders()
    const res = await fetch(`${BASE_URL}/videos/text2video/${taskId}`, {
      method: 'GET',
      headers,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Kling getTask ${res.status}: ${text}`)
    }

    const data = (await res.json()) as {
      data?: {
        task_id: string
        task_status: string
        task_status_msg?: string
        task_result?: {
          videos?: Array<{ id: string; url: string; duration: string }>
        }
      }
    }

    const task = data.data
    if (!task) throw new Error('Kling returned no task data')

    return {
      taskId: task.task_id,
      taskStatus: task.task_status as KlingTaskResult['taskStatus'],
      taskStatusMsg: task.task_status_msg,
      videos: task.task_result?.videos,
    }
  }
}
