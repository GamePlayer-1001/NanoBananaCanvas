/**
 * [INPUT]: 依赖 next-intl/routing 的 defineRouting
 * [OUTPUT]: 对外提供 routing 配置 (locales + defaultLocale + localePrefix 策略)
 * [POS]: i18n 的路由配置中心，被 middleware.ts / navigation.ts / request.ts 消费，决定公开 URL 是否暴露语言前缀
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { defineRouting } from 'next-intl/routing'
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from './config'

export const routing = defineRouting({
  locales: ACTIVE_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
})
