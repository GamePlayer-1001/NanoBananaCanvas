/**
 * [INPUT]: 依赖 @/i18n/config 的 locale 回退链
 * [OUTPUT]: 对外提供业务字段本地化工具 (i18n JSON 映射优先 + 列名后缀回退)
 * [POS]: lib 的 L10N 语义层，被 API Route 和业务数据映射消费，隔离历史双语列并承接可扩展多语言结构
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getLocaleFallbackChain } from '@/i18n/config'

function toFieldSuffix(locale: string) {
  return locale.toLowerCase().replace(/-/g, '_')
}

function toLocalizedRecord(value: unknown): Record<string, string> {
  if (typeof value === 'string') {
    try {
      return toLocalizedRecord(JSON.parse(value))
    } catch {
      return {}
    }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === 'string' &&
        typeof entry[1] === 'string' &&
        entry[1].trim().length > 0,
    ),
  )
}

function getLocalizedMap(record: Record<string, unknown>, fieldBase: string) {
  return toLocalizedRecord(record[`${fieldBase}_i18n`])
}

export function getLocalizedFieldValue(
  record: Record<string, unknown>,
  fieldBase: string,
  locale?: string | null,
): string {
  const localizedMap = getLocalizedMap(record, fieldBase)

  for (const candidate of getLocaleFallbackChain(locale)) {
    const directValue = localizedMap[candidate]
    if (typeof directValue === 'string' && directValue.trim().length > 0) {
      return directValue
    }

    const fieldName = `${fieldBase}_${toFieldSuffix(candidate)}`
    const value = record[fieldName]

    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return ''
}

export function getLocalizedFieldMap(
  record: Record<string, unknown>,
  fieldBase: string,
  locales: readonly string[],
): Record<string, string> {
  const localizedMap = getLocalizedMap(record, fieldBase)

  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      localizedMap[locale] ?? getLocalizedFieldValue(record, fieldBase, locale),
    ]),
  )
}
