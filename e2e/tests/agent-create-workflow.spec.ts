/**
 * [INPUT]: 依赖 @playwright/test，依赖工作区新建项目入口与画布页 Agent 面板
 * [OUTPUT]: 对外提供 Agent 创建工作流 E2E，覆盖“一句话生成工作流”主链
 * [POS]: e2e/tests 的 Agent 主链覆盖，验证从 workspace 到 canvas 的匿名创建与提案渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'
import {
  createProject,
  getAgentComposer,
  getAgentPanel,
  createProjectWithImageWorkflow,
} from './helpers/agent'

test.describe('Agent Workflow Creation', () => {
  test('creates a workflow proposal from one sentence', async ({ page }) => {
    await createProject(page)

    const agentPanel = getAgentPanel(page)
    const composer = getAgentComposer(page)
    await composer.fill('帮我生成一张电商海报图片')
    await composer.press('Enter')

    await expect(agentPanel.getByText('帮我生成一张电商海报图片')).toBeVisible()
    await expect(agentPanel.getByText(/我正在整理画板并生成提案，请稍等。?/)).toBeVisible()
    await expect(agentPanel.getByRole('button', { name: '为什么跑不通' })).toBeVisible()
  })

  test('confirms prompt and applies workflow to canvas', async ({ page }) => {
    await createProjectWithImageWorkflow(page)

    const agentPanel = getAgentPanel(page)
    await expect(agentPanel.getByRole('button', { name: '我想生成一张小猫的图片' })).toBeVisible()
    await expect(agentPanel.getByRole('button', { name: '为什么这条工作流跑不通' })).toBeVisible()
  })

  test('diagnoses the latest failed execution chain', async ({ page }) => {
    await createProjectWithImageWorkflow(page)

    const agentPanel = getAgentPanel(page)
    const composer = getAgentComposer(page)

    const textInputNode = page.getByPlaceholder('输入文本...')
    await expect(textInputNode).toBeVisible()
    await textInputNode.click()
    await textInputNode.press('Control+A')
    await textInputNode.press('Backspace')

    await page.getByRole('button', { name: '运行' }).first().click()

    await expect(agentPanel.getByRole('button', { name: '为什么这条工作流跑不通' })).toBeVisible()

    await composer.fill('为什么跑不通')
    await composer.press('Enter')

    await expect(agentPanel.getByText('为什么跑不通').first()).toBeVisible()
    await expect(agentPanel.getByText(/我正在整理画板并生成提案，请稍等。?/)).toBeVisible()
  })
})
