/**
 * [INPUT]: 依赖 ./types 的 TaskProcessor 接口，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 VideoGenProcessor 类
 * [POS]: lib/tasks/processors 的视频生成处理器骨架，后续按 Provider (kling/wan/sora) 扩展
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'

import type { CheckResult, SubmitInput, SubmitResult, TaskProcessor } from './types'

const log = createLogger('processor:video-gen')

export class VideoGenProcessor implements TaskProcessor {
  readonly taskType = 'video_gen' as const
  readonly provider: string

  constructor(provider: string) {
    this.provider = provider
  }

  async submit(input: SubmitInput, apiKey: string): Promise<SubmitResult> {
    log.info('Video gen submit', { model: input.model, provider: this.provider })
    // TODO: 按 provider 路由到具体实现 (kling/wan/sora/runway)
    throw new Error(`Provider "${this.provider}" not yet implemented for video_gen`)
  }

  async checkStatus(externalTaskId: string, apiKey: string): Promise<CheckResult> {
    log.debug('Video gen checkStatus', { externalTaskId, provider: this.provider })
    throw new Error(`Provider "${this.provider}" not yet implemented for video_gen`)
  }

  async cancel(externalTaskId: string, _apiKey: string): Promise<void> {
    // 大多数视频 Provider 不支持取消，默认 noop
    log.info('Video gen cancel (noop)', { externalTaskId, provider: this.provider })
  }
}
