/**
 * [INPUT]: 依赖 ../types 的 PlanType
 * [OUTPUT]: 对外提供套餐配置等共享常量
 * [POS]: packages/shared/constants 的入口桶文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { PlanType } from '../types'

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
/*  Supported Locales                           */
/* ============================================ */

export const LOCALES = ['en', 'zh'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
