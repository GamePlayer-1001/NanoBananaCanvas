/**
 * [INPUT]: 依赖 @playwright/test
 * [OUTPUT]: 路由导航 E2E 测试 — 公开页面可达与匿名主链稳定性
 * [POS]: e2e/tests 的路由系统公开主链覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

test.describe('Navigation & Routing', () => {
  test('root loads landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('/en/pricing loads pricing page', async ({ page }) => {
    await page.goto('/en/pricing')
    await expect(page).toHaveURL(/pricing/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('/en/privacy loads privacy policy', async ({ page }) => {
    await page.goto('/en/privacy')
    await expect(page).toHaveURL(/privacy/)
    await expect(page.getByRole('heading', { level: 1, name: /privacy|隐私/i })).toBeVisible()
  })

  test('/en/terms loads terms of service', async ({ page }) => {
    await page.goto('/en/terms')
    await expect(page).toHaveURL(/terms/)
    await expect(page.getByRole('heading', { level: 1, name: /terms|条款/i })).toBeVisible()
  })

  test('/en/contact loads contact page', async ({ page }) => {
    await page.goto('/en/contact')
    await expect(page).toHaveURL(/contact/)
    await expect(page.getByRole('heading', { level: 1, name: /contact|联系/i })).toBeVisible()
  })

  test('404 page renders for unknown routes', async ({ page }) => {
    const response = await page.goto('/en/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
  })
})
