/**
 * [INPUT]: 依赖 @playwright/test，依赖 Agent 节点语境与节点级修改链路
 * [OUTPUT]: 对外提供节点级修改 E2E
 * [POS]: e2e/tests 的 Agent 节点共创覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

import { createProjectWithImageWorkflow } from './helpers/agent'

test('updates selected node with node-level realistic instruction', async ({ page }) => {
  await createProjectWithImageWorkflow(page)

  await page.getByText('Image Gen', { exact: true }).click()
  const agentPanel = page.getByRole('complementary')
  await expect(agentPanel.getByText(/已选中节点/)).toBeVisible()

  const composer = agentPanel.getByPlaceholder('描述你想搭建或修改的工作流...')
  await composer.fill('把这个节点的提示词改成更写实')
  await composer.press('Enter')

  await expect(agentPanel.getByText('工作流提案', { exact: true }).first()).toBeVisible()
  await expect(agentPanel.getByText(/计划调整节点 .* 的局部配置/)).toBeVisible()
})
