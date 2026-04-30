/**
 * [INPUT]: 依赖 @playwright/test，依赖工作区新建项目入口与画布页 Agent 面板
 * [OUTPUT]: 对外提供 Agent 创建工作流 E2E，覆盖“一句话生成工作流”主链
 * [POS]: e2e/tests 的 Agent 主链覆盖，验证从 workspace 到 canvas 的匿名创建与提案渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'
import { createProject } from './helpers/agent'

test.describe('Agent Workflow Creation', () => {
  test('creates a workflow proposal from one sentence', async ({ page }) => {
    await createProject(page)

    const agentPanel = page.getByRole('complementary')
    const composer = agentPanel.getByPlaceholder('描述你想搭建或修改的工作流...')
    await composer.fill('帮我生成一张电商海报图片')
    await composer.press('Enter')

    await expect(agentPanel.getByText('工作流提案', { exact: true }).first()).toBeVisible()
    await expect(agentPanel.getByText('Prompt 确认', { exact: true })).toBeVisible()
    await expect(agentPanel.getByText('待确认', { exact: true }).first()).toBeVisible()
    await expect(agentPanel.getByText('计划新增 1 个 text-input 节点')).toBeVisible()
    await expect(agentPanel.getByText('计划新增 1 个 image-gen 节点')).toBeVisible()
    await expect(agentPanel.getByText('计划新增 1 个 display 节点')).toBeVisible()
  })

  test('confirms prompt and applies workflow to canvas', async ({ page }) => {
    await createProject(page)

    const agentPanel = page.getByRole('complementary')
    const composer = agentPanel.getByPlaceholder('描述你想搭建或修改的工作流...')
    await composer.fill('帮我生成一张电商海报图片')
    await composer.press('Enter')

    await expect(agentPanel.getByText('Prompt 确认', { exact: true })).toBeVisible()
    await agentPanel.getByRole('button', { name: '确认并执行' }).click()

    await expect(agentPanel.getByText('提示词已确认，我现在开始执行这个图片工作流。')).toBeVisible()
    await expect(agentPanel.getByText('我现在开始把提案安全落到左侧画板。')).toBeVisible()
    await expect(page.getByText('Text Input', { exact: true })).toBeVisible()
    await expect(page.getByText('Image Gen', { exact: true })).toBeVisible()
    await expect(page.getByText('Display', { exact: true })).toBeVisible()
  })

  test('diagnoses the latest failed execution chain', async ({ page }) => {
    await createProject(page)

    const agentPanel = page.getByRole('complementary')
    const composer = agentPanel.getByPlaceholder('描述你想搭建或修改的工作流...')
    await composer.fill('帮我生成一张电商海报图片')
    await composer.press('Enter')
    await expect(agentPanel.getByText('Prompt 确认', { exact: true })).toBeVisible()
    await agentPanel.getByRole('button', { name: '确认并执行' }).click()

    const textInputNode = page.getByPlaceholder('输入文本...')
    await expect(textInputNode).toBeVisible()
    await textInputNode.click()
    await textInputNode.press('Control+A')
    await textInputNode.press('Backspace')

    await page.getByRole('button', { name: '运行' }).first().click()

    await expect(
      agentPanel
        .getByText(/最近一次执行没有成功收口：Node "Image Gen" failed: Image gen node received empty prompt/)
        .first(),
    ).toBeVisible()

    await agentPanel.getByRole('button', { name: '为什么跑不通' }).click()

    await expect(agentPanel.getByText(/我定位到最近一次失败主要卡在/)).toBeVisible()
    await expect(agentPanel.getByText(/现象：.*Image gen node received empty prompt/)).toBeVisible()
    await expect(agentPanel.getByText(/根因：/)).toBeVisible()
    await expect(agentPanel.getByText(/建议：/)).toBeVisible()
  })
})
