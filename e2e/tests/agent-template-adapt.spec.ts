/**
 * [INPUT]: 依赖 @playwright/test，依赖画布页 Agent 面板与模板 quick action
 * [OUTPUT]: 对外提供模板改造链路 E2E
 * [POS]: e2e/tests 的 Agent 模板共创覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

import { createProjectWithTemplate } from './helpers/agent'

test('adapts current template direction from agent quick action', async ({ page }) => {
  await createProjectWithTemplate(page)

  const agentPanel = page.getByRole('complementary')
  await expect(agentPanel.getByText(/当前模板：电商商品图起手模板/)).toBeVisible()
  await agentPanel.getByRole('button', { name: '改造当前模板' }).click()

  await expect(agentPanel.getByText('工作流提案', { exact: true }).first()).toBeVisible()
  await expect(agentPanel.getByText(/基于模板改造/)).toBeVisible()
})
