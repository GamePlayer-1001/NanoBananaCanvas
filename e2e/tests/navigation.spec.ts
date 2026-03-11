/**
 * [INPUT]: 依赖 @playwright/test
 * [OUTPUT]: 路由导航 E2E 测试 — i18n 重定向、认证重定向、公开页面可达
 * [POS]: e2e/tests 的路由系统核心覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

test.describe('Navigation & Routing', () => {
  test('root redirects to locale prefix', async ({ page }) => {
    await page.goto('/')
    // next-intl 应重定向到 /en 或 /zh
    await expect(page).toHaveURL(/\/(en|zh)/)
  })

  test('/en/pricing loads pricing page', async ({ page }) => {
    await page.goto('/en/pricing')
    await expect(page).toHaveURL(/pricing/)
    // 应该有定价相关内容
    await expect(page.locator('main')).toBeVisible()
  })

  test('/en/privacy loads privacy policy', async ({ page }) => {
    await page.goto('/en/privacy')
    await expect(page).toHaveURL(/privacy/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('/en/terms loads terms of service', async ({ page }) => {
    await page.goto('/en/terms')
    await expect(page).toHaveURL(/terms/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('/en/contact loads contact page', async ({ page }) => {
    await page.goto('/en/contact')
    await expect(page).toHaveURL(/contact/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('protected routes redirect to sign-in', async ({ page }) => {
    // workspace 是需要认证的路由
    await page.goto('/en/workspace')
    // Clerk middleware 应重定向到 sign-in
    await expect(page).toHaveURL(/sign-in/, { timeout: 10_000 })
  })

  test('404 page renders for unknown routes', async ({ page }) => {
    const response = await page.goto('/en/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
  })
})
