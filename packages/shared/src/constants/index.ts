/**
 * [INPUT]: 依赖 ../types 的 PlanType, BillingPeriod
 * [OUTPUT]: 对外提供套餐配置、定价、Locale、TaskConfig 等共享常量
 * [POS]: packages/shared/constants 的入口桶文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { AsyncTaskType, BillingPeriod, PlanType } from '../types'

/* ============================================ */
/*  Plan Configuration                          */
/* ============================================ */

export interface PlanConfig {
  name: string
  nameKey: string
  monthlyCredits: number
  maxConcurrentTasks: number
  storageGB: number
  popular?: boolean
  features: string[]
}

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Free',
    nameKey: 'free',
    monthlyCredits: 200,
    maxConcurrentTasks: 1,
    storageGB: 1,
    features: ['feature_basic', 'feature_community', 'feature_export'],
  },
  pro: {
    name: 'Pro',
    nameKey: 'pro',
    monthlyCredits: 5000,
    maxConcurrentTasks: 4,
    storageGB: 50,
    popular: true,
    features: ['feature_basic', 'feature_community', 'feature_export', 'feature_priority', 'feature_history', 'feature_api', 'feature_team'],
  },
}

/* ============================================ */
/*  Pricing (USD cents)                         */
/* ============================================ */

export const PRO_PRICING: Record<BillingPeriod, number> = {
  weekly: 999,
  monthly: 2999,
  yearly: 9999,
}

/* ============================================ */
/*  Supported Locales                           */
/* ============================================ */

export const LOCALES = ['en', 'zh'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/* ============================================ */
/*  Credits                                     */
/* ============================================ */

/** 冻结积分超时清理 TTL (分钟) — 超过此时间的 freeze 被 Cron 自动解冻 */
export const FREEZE_TTL_MINUTES = 5

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
  /** 全局超时 (ms) — 超时后标记 failed + 退还积分 */
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
    pollIntervalMs: 3_000,
    providerCheckThrottleMs: 5_000,
    timeoutMs: 5 * 60 * 1_000,
  },
  audio_gen: {
    maxRetries: 2,
    pollIntervalMs: 3_000,
    providerCheckThrottleMs: 5_000,
    timeoutMs: 3 * 60 * 1_000,
  },
}
