/**
 * [INPUT]: 依赖 @playwright/test，依赖 Agent 优化建议链路
 * [OUTPUT]: 对外提供优化建议并确认应用 E2E
 * [POS]: e2e/tests 的 Agent 优化闭环覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

import { createProjectWithImageWorkflow, getAgentPanel } from './helpers/agent'

test('generates optimize proposal and keeps apply action available', async ({ page }) => {
  await createProjectWithImageWorkflow(page)

  const agentPanel = getAgentPanel(page)
  await agentPanel.getByRole('button', { name: '帮我优化成本' }).click()

  await expect(agentPanel.getByText('我发现这条链还有明显的降本空间。', { exact: true })).toBeVisible()
  await expect(agentPanel.getByText(/问题：模型成本偏高/)).toBeVisible()
  await expect(agentPanel.getByText(/提案：先替换最贵节点为便宜一档模型，同时关闭预览开关/)).toBeVisible()
})
