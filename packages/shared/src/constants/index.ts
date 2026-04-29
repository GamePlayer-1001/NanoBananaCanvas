/**
 * [INPUT]: 依赖 ../types 的 AsyncTaskType
 * [OUTPUT]: 对外提供 Locale、TaskConfig 等共享常量
 * [POS]: packages/shared/constants 的入口桶文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { AsyncTaskType } from '../types'

/* ============================================ */
/*  Supported Locales                           */
/* ============================================ */

export const LOCALES = ['en', 'zh'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/* ============================================ */
/*  P2: Async Task Configuration               */
/* ============================================ */

export interface TaskTypeConfig {
  /** 最大重试次数 */
  maxRetries: number
  /** 前端轮询间隔 (ms) */
  pollIntervalMs: number
  /** Provider 查询节流间隔 (ms) — 两次 checkStatus 之间的最小间隔 */
  providerCheckThrottleMs: number
  /** 全局超时 (ms) — 超时后标记 failed */
  timeoutMs: number
}

export const TASK_CONFIG: Record<AsyncTaskType, TaskTypeConfig> = {
  video_gen: {
    maxRetries: 2,
    pollIntervalMs: 5_000,
    providerCheckThrottleMs: 10_000,
    timeoutMs: 15 * 60 * 1_000,
  },
  image_gen: {
    maxRetries: 2,
    pollIntervalMs: 5_000,
    providerCheckThrottleMs: 10_000,
    timeoutMs: 15 * 60 * 1_000,
  },
  audio_gen: {
    maxRetries: 2,
    pollIntervalMs: 3_000,
    providerCheckThrottleMs: 5_000,
    timeoutMs: 3 * 60 * 1_000,
  },
}
