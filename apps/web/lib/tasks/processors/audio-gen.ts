/**
 * [INPUT]: 依赖 ./types 的 TaskProcessor 接口，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 AudioGenProcessor 类
 * [POS]: lib/tasks/processors 的音频生成处理器骨架，后续按 Provider (elevenlabs/edge-tts/cosyvoice) 扩展
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'

import type { CheckResult, SubmitInput, SubmitResult, TaskProcessor } from './types'

const log = createLogger('processor:audio-gen')

export class AudioGenProcessor implements TaskProcessor {
  readonly taskType = 'audio_gen' as const
  readonly provider: string

  constructor(provider: string) {
    this.provider = provider
  }

  async submit(input: SubmitInput, apiKey: string): Promise<SubmitResult> {
    log.info('Audio gen submit', { model: input.model, provider: this.provider })
    throw new Error(`Provider "${this.provider}" not yet implemented for audio_gen`)
  }

  async checkStatus(externalTaskId: string, apiKey: string): Promise<CheckResult> {
    log.debug('Audio gen checkStatus', { externalTaskId, provider: this.provider })
    throw new Error(`Provider "${this.provider}" not yet implemented for audio_gen`)
  }

  async cancel(externalTaskId: string, _apiKey: string): Promise<void> {
    log.info('Audio gen cancel (noop)', { externalTaskId, provider: this.provider })
  }
}
