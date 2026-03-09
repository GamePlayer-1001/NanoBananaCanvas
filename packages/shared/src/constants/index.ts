/**
 * [INPUT]: 依赖 ../types 的 PlanType
 * [OUTPUT]: 对外提供套餐配置、模型定价等共享常量
 * [POS]: packages/shared/constants 的入口桶文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { PlanType } from '../types'

/* ============================================ */
/*  Currency                                    */
/* ============================================ */

export type CurrencyType = 'usd' | 'cny'

export const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  usd: '$',
  cny: '¥',
}

/* ============================================ */
/*  Plan Configuration                          */
/* ============================================ */

export interface PlanConfig {
  name: string
  nameKey: string
  monthlyPrice: number
  yearlyPrice: number
  monthlyPriceCny: number
  yearlyPriceCny: number
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
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyPriceCny: 0,
    yearlyPriceCny: 0,
    monthlyCredits: 200,
    maxConcurrentTasks: 1,
    storageGB: 1,
    features: ['feature_basic', 'feature_community', 'feature_export'],
  },
  standard: {
    name: 'Standard',
    nameKey: 'standard',
    monthlyPrice: 9,
    yearlyPrice: 90,
    monthlyPriceCny: 29,
    yearlyPriceCny: 299,
    monthlyCredits: 1000,
    maxConcurrentTasks: 2,
    storageGB: 10,
    features: ['feature_basic', 'feature_community', 'feature_export', 'feature_priority', 'feature_history'],
  },
  pro: {
    name: 'Pro',
    nameKey: 'pro',
    monthlyPrice: 29,
    yearlyPrice: 290,
    monthlyPriceCny: 99,
    yearlyPriceCny: 999,
    monthlyCredits: 5000,
    maxConcurrentTasks: 4,
    storageGB: 50,
    popular: true,
    features: ['feature_basic', 'feature_community', 'feature_export', 'feature_priority', 'feature_history', 'feature_api', 'feature_team'],
  },
  ultimate: {
    name: 'Ultimate',
    nameKey: 'ultimate',
    monthlyPrice: 79,
    yearlyPrice: 790,
    monthlyPriceCny: 269,
    yearlyPriceCny: 2699,
    monthlyCredits: 17000,
    maxConcurrentTasks: 8,
    storageGB: 200,
    features: ['feature_basic', 'feature_community', 'feature_export', 'feature_priority', 'feature_history', 'feature_api', 'feature_team', 'feature_unlimited', 'feature_dedicated'],
  },
}

/* ============================================ */
/*  Supported Locales                           */
/* ============================================ */

export const LOCALES = ['en', 'zh'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
