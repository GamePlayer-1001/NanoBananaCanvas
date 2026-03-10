/**
 * [INPUT]: 依赖 ./video-gen, ./image-gen, ./audio-gen, @/lib/errors
 * [OUTPUT]: 对外提供 getProcessor(taskType, provider) 工厂函数
 * [POS]: lib/tasks/processors 的注册表，统一路由 taskType+provider → Processor 实例
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { AsyncTaskType } from '@nano-banana/shared'

import { createLogger } from '@/lib/logger'

import { AudioGenProcessor } from './audio-gen'
import { ImageGenProcessor } from './image-gen'
import type { TaskProcessor } from './types'
import { VideoGenProcessor } from './video-gen'

const log = createLogger('processor:registry')

/* ─── Factory Map ───────────────────────────────────── */

type ProcessorFactory = (provider: string) => TaskProcessor

const factories: Record<AsyncTaskType, ProcessorFactory> = {
  video_gen: (p) => new VideoGenProcessor(p),
  image_gen: (p) => new ImageGenProcessor(p),
  audio_gen: (p) => new AudioGenProcessor(p),
}

/* ─── Public API ────────────────────────────────────── */

export function getProcessor(taskType: AsyncTaskType, provider: string): TaskProcessor {
  const factory = factories[taskType]
  if (!factory) {
    throw new Error(`Unknown task type: ${taskType}`)
  }
  log.debug('Resolved processor', { taskType, provider })
  return factory(provider)
}
