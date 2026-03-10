/**
 * [INPUT]: 依赖 ./types 的 TaskProcessor 接口，依赖 @/lib/logger，依赖 @/services/video/kling
 * [OUTPUT]: 对外提供 VideoGenProcessor 类 (可灵实现 + 即梦骨架)
 * [POS]: lib/tasks/processors 的视频生成处理器，按 provider 分发到可灵或即梦
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'
import { KlingClient } from '@/services/video/kling'

import type { CheckResult, SubmitInput, SubmitResult, TaskProcessor } from './types'

const log = createLogger('processor:video-gen')

/* ─── Kling Helpers ──────────────────────────────────── */

function createKlingClient(apiKey: string): KlingClient {
  // apiKey format: "accessKey:secretKey"
  const [accessKey, secretKey] = apiKey.split(':')
  if (!accessKey || !secretKey) {
    throw new Error('Kling API key must be "accessKey:secretKey" format')
  }
  return new KlingClient({ accessKey, secretKey })
}

/* ─── Processor ──────────────────────────────────────── */

export class VideoGenProcessor implements TaskProcessor {
  readonly taskType = 'video_gen' as const
  readonly provider: string

  constructor(provider: string) {
    this.provider = provider
  }

  async submit(input: SubmitInput, apiKey: string): Promise<SubmitResult> {
    log.info('Video gen submit', { model: input.model, provider: this.provider })

    switch (this.provider) {
      case 'kling':
        return this.submitKling(input, apiKey)
      case 'jimeng':
        throw new Error('Jimeng (即梦) provider not yet available — API unreleased')
      default:
        throw new Error(`Provider "${this.provider}" not supported for video_gen`)
    }
  }

  async checkStatus(externalTaskId: string, apiKey: string): Promise<CheckResult> {
    log.debug('Video gen checkStatus', { externalTaskId, provider: this.provider })

    switch (this.provider) {
      case 'kling':
        return this.checkKling(externalTaskId, apiKey)
      case 'jimeng':
        throw new Error('Jimeng (即梦) provider not yet available')
      default:
        throw new Error(`Provider "${this.provider}" not supported for video_gen`)
    }
  }

  async cancel(_externalTaskId: string, _apiKey: string): Promise<void> {
    log.info('Video gen cancel (noop)', { provider: this.provider })
  }

  /* ── Kling: Submit ─────────────────────────────────── */

  private async submitKling(input: SubmitInput, apiKey: string): Promise<SubmitResult> {
    const client = createKlingClient(apiKey)
    const { model, params } = input
    const imageUrl = params.imageUrl as string | undefined

    let taskId: string

    if (imageUrl) {
      taskId = await client.imageToVideo({
        model,
        imageUrl,
        prompt: (params.prompt as string) ?? '',
        duration: (params.duration as '5' | '10') ?? '5',
      })
    } else {
      taskId = await client.textToVideo({
        model,
        prompt: (params.prompt as string) ?? '',
        duration: (params.duration as '5' | '10') ?? '5',
        aspectRatio: (params.aspectRatio as '16:9' | '9:16' | '1:1') ?? '16:9',
        mode: (params.mode as 'std' | 'pro') ?? 'std',
      })
    }

    return { externalTaskId: taskId, initialStatus: 'running' }
  }

  /* ── Kling: Check ──────────────────────────────────── */

  private async checkKling(externalTaskId: string, apiKey: string): Promise<CheckResult> {
    const client = createKlingClient(apiKey)
    const task = await client.getTaskStatus(externalTaskId)

    const statusMap: Record<string, CheckResult['status']> = {
      submitted: 'pending',
      processing: 'running',
      succeed: 'completed',
      failed: 'failed',
    }

    const progressMap: Record<string, number> = {
      submitted: 10,
      processing: 50,
      succeed: 100,
      failed: 0,
    }

    const status = statusMap[task.taskStatus] ?? 'running'
    const result: CheckResult = {
      status,
      progress: progressMap[task.taskStatus] ?? 0,
    }

    if (status === 'completed' && task.videos?.[0]) {
      result.result = {
        type: 'url',
        url: task.videos[0].url,
        contentType: 'video/mp4',
      }
    }

    if (status === 'failed') {
      result.error = task.taskStatusMsg ?? 'Video generation failed'
    }

    return result
  }
}
