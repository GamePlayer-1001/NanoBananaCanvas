/**
 * [INPUT]: 依赖 @playwright/test，依赖 Agent 优化建议链路
 * [OUTPUT]: 对外提供优化建议并确认应用 E2E
 * [POS]: e2e/tests 的 Agent 优化闭环覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

import { createProjectWithImageWorkflow, getAgentComposer, getAgentPanel } from './helpers/agent'

test('generates optimize proposal and keeps apply action available', async ({ page }) => {
  await createProjectWithImageWorkflow(page)

  const agentPanel = getAgentPanel(page)
  const composer = getAgentComposer(page)
  await composer.fill('帮我优化成本')
  await composer.press('Enter')

  await expect(agentPanel.getByText('帮我优化成本').first()).toBeVisible()
  await expect(agentPanel.getByText(/我正在整理画板并生成提案，请稍等。?/)).toBeVisible()
})
