/**
 * [INPUT]: 依赖 lib/seo 的 hreflang/canonical 工具
 * [OUTPUT]: 锁定多语言 hreflang/x-default 行为，防止 Google Search Console 重复内容回归
 * [POS]: SEO 语义层回归测试
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { buildLanguageAlternates, buildLocalizedUrl } from '@/lib/seo'

describe('buildLanguageAlternates', () => {
  it('emits hreflang for every active locale even when called from a single-locale sitemap', () => {
    const alternates = buildLanguageAlternates('/')

    expect(Object.keys(alternates).sort()).toEqual([
      'en',
      'x-default',
      'zh',
    ])
  })

  it('always points x-default at the default locale, regardless of caller order', () => {
    const fromZh = buildLanguageAlternates('/')
    expect(fromZh['x-default']).toBe('https://nanobananacanvas.com/')
    expect(fromZh.zh).toBe('https://nanobananacanvas.com/zh')
    expect(fromZh.en).toBe('https://nanobananacanvas.com/')
  })
})

describe('buildLocalizedUrl', () => {
  it('keeps default locale prefix-less and only prefixes non-default locales', () => {
    expect(buildLocalizedUrl('/', 'en')).toBe('https://nanobananacanvas.com/')
    expect(buildLocalizedUrl('/', 'zh')).toBe('https://nanobananacanvas.com/zh')
    expect(buildLocalizedUrl('/explore/abc', 'en')).toBe(
      'https://nanobananacanvas.com/explore/abc',
    )
    expect(buildLocalizedUrl('/explore/abc', 'zh')).toBe(
      'https://nanobananacanvas.com/zh/explore/abc',
    )
  })
})
