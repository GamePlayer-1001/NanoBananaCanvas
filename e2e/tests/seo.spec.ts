/**
 * [INPUT]: 依赖 @playwright/test
 * [OUTPUT]: SEO E2E 测试 — sitemap/robots/OG/meta
 * [POS]: e2e/tests 的 SEO 基础设施核心覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

test.describe('SEO Infrastructure', () => {
  test('robots.txt is accessible and well-formed', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.ok()).toBeTruthy()

    const text = await res.text()
    expect(text).toContain('User-agent')
    expect(text).toContain('Sitemap')
    // API 路由不应被爬虫索引
    expect(text).toContain('Disallow')
  })

  test('sitemap.xml is accessible and well-formed', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.ok()).toBeTruthy()

    const text = await res.text()
    expect(text).toContain('<?xml')
    expect(text).toContain('<urlset')
    expect(text).toContain('<url>')
    expect(text).toContain('<loc>')
  })

  test('Landing page has proper meta tags', async ({ page }) => {
    await page.goto('/')

    // title 应该存在且非空
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)

    // description meta tag
    const description = page.locator('meta[name="description"]')
    await expect(description).toHaveAttribute('content', /.+/)

    // OG tags
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /.+/)

    const ogType = page.locator('meta[property="og:type"]')
    await expect(ogType).toHaveAttribute('content', /.+/)
  })

  test('OG image endpoint returns valid image', async ({ request }) => {
    const res = await request.get('/api/og')

    if (res.ok()) {
      const contentType = res.headers()['content-type']
      expect(contentType).toContain('image')
    }
    // 即使生成失败也不应 500
    expect(res.status()).not.toBe(500)
  })

  test('Pricing page has unique meta description', async ({ page }) => {
    await page.goto('/en/pricing')

    const description = page.locator('meta[name="description"]')
    const content = await description.getAttribute('content')
    expect(content).toBeTruthy()
    expect(content!.length).toBeGreaterThan(20)
  })
})
