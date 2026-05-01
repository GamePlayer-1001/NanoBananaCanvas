/**
 * [INPUT]: 依赖 @playwright/test，依赖画布页 Agent 面板与模板 quick action
 * [OUTPUT]: 对外提供模板改造链路 E2E
 * [POS]: e2e/tests 的 Agent 模板共创覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

import { createProjectWithTemplate, getAgentPanel } from './helpers/agent'

test('adapts current template direction from agent quick action', async ({ page }) => {
  await createProjectWithTemplate(page)

  const agentPanel = getAgentPanel(page)
  await expect(agentPanel.getByRole('button', { name: '我想生成一张小猫的图片' })).toBeVisible()
  await expect(agentPanel.getByRole('button', { name: '向我介绍一下这条工作流' })).toBeVisible()
})
