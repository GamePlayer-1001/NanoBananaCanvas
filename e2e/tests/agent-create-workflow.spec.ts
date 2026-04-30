/**
 * [INPUT]: 依赖 @playwright/test，依赖工作区新建项目入口与画布页 Agent 面板
 * [OUTPUT]: 对外提供 Agent 创建工作流 E2E，覆盖“一句话生成工作流”主链
 * [POS]: e2e/tests 的 Agent 主链覆盖，验证从 workspace 到 canvas 的匿名创建与提案渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

async function createProject(page: Parameters<typeof test>[0]['page']) {
  await page.goto('/zh/workspace')
  await page.getByRole('button', { name: '新建项目' }).click()
  await expect(page.getByRole('heading', { name: '创建项目' })).toBeVisible()
  await page.getByPlaceholder('未命名项目').fill(`Agent E2E ${Date.now()}`)
  await page.getByRole('button', { name: '创建项目' }).last().click()
  await expect(page).toHaveURL(/\/zh\/canvas\/[^/]+$/)
}

test.describe('Agent Workflow Creation', () => {
  test('creates a workflow proposal from one sentence', async ({ page }) => {
    await createProject(page)

    const agentPanel = page.getByRole('complementary')
    const composer = agentPanel.getByPlaceholder('描述你想搭建或修改的工作流...')
    await composer.fill('帮我生成一张电商海报图片')
    await composer.press('Enter')

    await expect(agentPanel.getByText('工作流提案', { exact: true })).toBeVisible()
    await expect(agentPanel.getByText('Prompt 确认', { exact: true })).toBeVisible()
    await expect(agentPanel.getByText('待确认', { exact: true })).toBeVisible()
    await expect(agentPanel.getByText('计划新增 1 个 text-input 节点')).toBeVisible()
    await expect(agentPanel.getByText('计划新增 1 个 image-gen 节点')).toBeVisible()
    await expect(agentPanel.getByText('计划新增 1 个 display 节点')).toBeVisible()
  })
})
