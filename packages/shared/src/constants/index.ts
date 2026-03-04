/**
 * [INPUT]: 依赖 ../types 的 PlanType
 * [OUTPUT]: 对外提供套餐配置、模型定价等共享常量
 * [POS]: packages/shared/constants 的入口桶文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { PlanType } from '../types'

/* ============================================ */
/*  Plan Configuration                          */
/* ============================================ */

export const PLANS: Record<
  PlanType,
  {
    name: string
    monthlyPrice: number
    yearlyPrice: number
    monthlyCredits: number
    maxConcurrentTasks: number
    storageGB: number
  }
> = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyCredits: 200,
    maxConcurrentTasks: 1,
    storageGB: 1,
  },
  standard: {
    name: 'Standard',
    monthlyPrice: 20,
    yearlyPrice: 192,
    monthlyCredits: 1600,
    maxConcurrentTasks: 2,
    storageGB: 10,
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 50,
    yearlyPrice: 480,
    monthlyCredits: 5400,
    maxConcurrentTasks: 4,
    storageGB: 50,
  },
  ultimate: {
    name: 'Ultimate',
    monthlyPrice: 150,
    yearlyPrice: 1440,
    monthlyCredits: 17000,
    maxConcurrentTasks: 8,
    storageGB: 200,
  },
}

/* ============================================ */
/*  Supported Locales                           */
/* ============================================ */

export const LOCALES = ['en', 'zh'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
