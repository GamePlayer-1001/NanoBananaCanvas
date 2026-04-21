/**
 * [INPUT]: 依赖 vitest，依赖 ./l10n 的业务字段本地化工具
 * [OUTPUT]: 对外提供 L10N 字段回退测试
 * [POS]: lib 的本地化语义测试，确保语言回退链和多语言值映射稳定
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'
import { getLocalizedFieldMap, getLocalizedFieldValue } from './l10n'

describe('getLocalizedFieldValue', () => {
  const categoryRecord = {
    name_en: 'Image Generation',
    name_zh: '图片生成',
  }

  it('prefers json-backed translations when available', () => {
    expect(
      getLocalizedFieldValue(
        {
          name_i18n: JSON.stringify({
            en: 'Image Generation',
            zh: '图片生成',
          }),
          name_en: 'Legacy Image Generation',
          name_zh: '旧版图片生成',
        },
        'name',
        'zh',
      ),
    ).toBe('图片生成')
  })

  it('returns the requested locale when the translation exists', () => {
    expect(getLocalizedFieldValue(categoryRecord, 'name', 'zh')).toBe('图片生成')
  })

  it('falls back from locale variants to the matching active language', () => {
    expect(getLocalizedFieldValue(categoryRecord, 'name', 'zh-CN')).toBe('图片生成')
  })

  it('falls back to the default locale when the requested translation is unavailable', () => {
    expect(getLocalizedFieldValue(categoryRecord, 'name', 'ja')).toBe('Image Generation')
  })
})

describe('getLocalizedFieldMap', () => {
  it('builds a locale-to-value map for the provided locales', () => {
    expect(
      getLocalizedFieldMap(
        {
          title_i18n: JSON.stringify({
            en: 'Workspace',
            zh: '工作区',
          }),
          title_en: 'Workspace',
          title_zh: '工作区',
        },
        'title',
        ['en', 'zh', 'ja'],
      ),
    ).toEqual({
      en: 'Workspace',
      zh: '工作区',
      ja: 'Workspace',
    })
  })
})
