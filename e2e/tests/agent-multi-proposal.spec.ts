/**
 * [INPUT]: 依赖 @playwright/test，依赖 Agent 多提案比较链路
 * [OUTPUT]: 对外提供多提案选择并落图 E2E
 * [POS]: e2e/tests 的 Agent 多方案比较覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

import { createProject } from './helpers/agent'

test('compares multiple proposals and allows switching variants', async ({ page }) => {
  await createProject(page)

  const agentPanel = page.getByRole('complementary')
  const composer = agentPanel.getByPlaceholder('描述你想搭建或修改的工作流...')
  await composer.fill('帮我生成一张电商海报图片')
  await composer.press('Enter')

  await expect(agentPanel.getByText('多方案比较')).toBeVisible()
  await expect(agentPanel.getByRole('button', { name: /切换到/ })).toBeVisible()
})
