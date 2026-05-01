/**
 * [INPUT]: 依赖 @playwright/test，依赖 Agent 结果续写链路
 * [OUTPUT]: 对外提供基于结果自动建议下一步 E2E
 * [POS]: e2e/tests 的 Agent 结果续写覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

import { createProjectWithResultAsset, getAgentPanel } from './helpers/agent'

test('shows continue-from-result quick action after image workflow is created', async ({ page }) => {
  await createProjectWithResultAsset(page)

  const agentPanel = getAgentPanel(page)
  await expect(agentPanel.getByRole('button', { name: '我想生成一张小猫的图片' })).toBeVisible()
  await expect(agentPanel.getByRole('button', { name: '为什么这条工作流跑不通' })).toBeVisible()
})
