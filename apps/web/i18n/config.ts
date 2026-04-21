/**
 * [INPUT]: 无外部运行时依赖
 * [OUTPUT]: 对外提供 locale 单一真相源 (启用语言/默认语言/显示名/OG locale/切换选项)
 * [POS]: i18n 的静态配置中心，被 routing/request/layout/seo/structured-data 等模块消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const DEFAULT_LOCALE = 'en'

export const ACTIVE_LOCALES = ['en', 'zh'] as const

export type AppLocale = (typeof ACTIVE_LOCALES)[number]

export interface LocaleDefinition {
  code: AppLocale
  englishName: string
  nativeName: string
  switcherLabel: string
  ogLocale: string
  fallbackLocale: AppLocale
  clerkLocalizationKey?: 'zhCN'
}

export const LOCALE_DEFINITIONS: Record<AppLocale, LocaleDefinition> = {
  en: {
    code: 'en',
    englishName: 'English',
    nativeName: 'English',
    switcherLabel: 'EN',
    ogLocale: 'en_US',
    fallbackLocale: 'en',
  },
  zh: {
    code: 'zh',
    englishName: 'Chinese',
    nativeName: '中文',
    switcherLabel: '中文',
    ogLocale: 'zh_CN',
    fallbackLocale: 'en',
    clerkLocalizationKey: 'zhCN',
  },
}

export const AVAILABLE_LANGUAGE_CODES = [...ACTIVE_LOCALES]

function getLocaleCandidates(locale?: string | null) {
  if (!locale) {
    return []
  }

  const normalized = locale.trim().replace(/_/g, '-').toLowerCase()
  const language = normalized.split('-')[0]
  return [...new Set([normalized, language])]
}

export function isActiveLocale(locale: string): locale is AppLocale {
  return ACTIVE_LOCALES.includes(locale as AppLocale)
}

export function resolveLocale(locale?: string | null): AppLocale {
  for (const candidate of getLocaleCandidates(locale)) {
    if (isActiveLocale(candidate)) {
      return candidate
    }
  }

  return DEFAULT_LOCALE
}

export function getLocaleDefinition(locale?: string | null): LocaleDefinition {
  return LOCALE_DEFINITIONS[resolveLocale(locale)]
}

export function getLocaleFallbackChain(locale?: string | null): AppLocale[] {
  const resolved = resolveLocale(locale)
  const fallback = LOCALE_DEFINITIONS[resolved].fallbackLocale
  return Array.from(new Set<AppLocale>([resolved, fallback, DEFAULT_LOCALE]))
}

export function getLocaleMenuOptions() {
  return ACTIVE_LOCALES.map((locale) => LOCALE_DEFINITIONS[locale])
}
