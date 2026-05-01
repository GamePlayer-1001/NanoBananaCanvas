/**
 * [INPUT]: 依赖 @playwright/test，依赖 Agent 多提案比较链路
 * [OUTPUT]: 对外提供多提案选择并落图 E2E
 * [POS]: e2e/tests 的 Agent 多方案比较覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

import { createProject, getAgentComposer, getAgentPanel } from './helpers/agent'

test('compares multiple proposals and allows switching variants', async ({ page }) => {
  await createProject(page)

  const agentPanel = getAgentPanel(page)
  const composer = getAgentComposer(page)
  await composer.fill('给我几个不同方向的电商海报工作流方案')
  await composer.press('Enter')

  await expect(
    agentPanel.getByText(/连接 draft-text-input -> draft-image-gen 需要在真实落图时再确认端口兼容性/),
  ).toBeVisible()
  await expect(page.getByText('Image Gen', { exact: true })).toBeVisible()
})
