/**
 * [INPUT]: 依赖 @playwright/test
 * [OUTPUT]: Landing Page E2E 测试 — 首屏渲染、导航链接、Hero 交互
 * [POS]: e2e/tests 的 Landing 页面核心流程覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders hero section with CTA', async ({ page }) => {
    // Hero 标题应该可见
    await expect(page.locator('h1').first()).toBeVisible()

    // 至少有一个 CTA 按钮
    const cta = page.getByRole('link', { name: /get started|开始/i })
    await expect(cta.first()).toBeVisible()
  })

  test('navigation bar links are present', async ({ page }) => {
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()

    // 品牌 Logo 或名称
    await expect(nav.getByRole('link').first()).toBeVisible()
  })

  test('footer is visible', async ({ page }) => {
    const footer = page.locator('footer').first()
    await expect(footer).toBeVisible()
  })

  test('pricing link navigates correctly', async ({ page }) => {
    const pricingLink = page.getByRole('link', { name: /pricing|定价/i }).first()

    if (await pricingLink.isVisible()) {
      await pricingLink.click()
      await expect(page).toHaveURL(/pricing/)
    }
  })

  test('page loads within performance budget', async ({ page }) => {
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return { domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime }
    })

    // DOM Content Loaded should be under 5s (generous for dev server)
    expect(timing.domContentLoaded).toBeLessThan(5000)
  })
})
