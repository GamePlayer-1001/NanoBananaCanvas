/**
 * [INPUT]: 依赖 @/i18n/config 的 locale 回退链
 * [OUTPUT]: 对外提供业务字段本地化工具 (列名后缀推导 + 多语言值读取)
 * [POS]: lib 的 L10N 语义层，被 API Route 和业务数据映射消费，隔离 name_en/name_zh 这类历史双语列
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getLocaleFallbackChain } from '@/i18n/config'

function toFieldSuffix(locale: string) {
  return locale.toLowerCase().replace(/-/g, '_')
}

export function getLocalizedFieldValue(
  record: Record<string, unknown>,
  fieldBase: string,
  locale?: string | null,
): string {
  for (const candidate of getLocaleFallbackChain(locale)) {
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
  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      getLocalizedFieldValue(record, fieldBase, locale),
    ]),
  )
}
