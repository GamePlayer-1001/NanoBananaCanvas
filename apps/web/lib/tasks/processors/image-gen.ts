/**
 * [INPUT]: 依赖 ./types 的 TaskProcessor 接口，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 ImageGenProcessor 类
 * [POS]: lib/tasks/processors 的图片生成处理器骨架，后续按 Provider (flux/dall-e/sd/qwen) 扩展
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'

import type { CheckResult, SubmitInput, SubmitResult, TaskProcessor } from './types'

const log = createLogger('processor:image-gen')

export class ImageGenProcessor implements TaskProcessor {
  readonly taskType = 'image_gen' as const
  readonly provider: string

  constructor(provider: string) {
    this.provider = provider
  }

  async submit(input: SubmitInput, apiKey: string): Promise<SubmitResult> {
    log.info('Image gen submit', { model: input.model, provider: this.provider })
    throw new Error(`Provider "${this.provider}" not yet implemented for image_gen`)
  }

  async checkStatus(externalTaskId: string, apiKey: string): Promise<CheckResult> {
    log.debug('Image gen checkStatus', { externalTaskId, provider: this.provider })
    throw new Error(`Provider "${this.provider}" not yet implemented for image_gen`)
  }

  async cancel(externalTaskId: string, _apiKey: string): Promise<void> {
    log.info('Image gen cancel (noop)', { externalTaskId, provider: this.provider })
  }
}
