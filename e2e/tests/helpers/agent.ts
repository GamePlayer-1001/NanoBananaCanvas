/**
 * [INPUT]: 依赖 @playwright/test 的 page 对象
 * [OUTPUT]: 对外提供 Agent E2E 公共建项目/生成图片工作流 helper
 * [POS]: e2e/tests/helpers 的 Agent 场景复用层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, type Page } from '@playwright/test'

export function getAgentPanel(page: Page) {
  return page.getByTestId('agent-panel')
}

export function getAgentComposer(page: Page) {
  return getAgentPanel(page).getByPlaceholder('描述你想搭建或修改的工作流...')
}

export function getCanvasNode(page: Page, label: string) {
  return page.locator('.react-flow__node').filter({ hasText: label }).first()
}

export function getPromptConfirmationCard(page: Page) {
  return getAgentPanel(page).getByText('Prompt 确认')
}

export async function ensureAgentCredits(page: Page) {
  const response = await page.request.post('/api/test/credits')
  expect(response.ok()).toBeTruthy()
}

export async function createProject(page: Page) {
  await ensureAgentCredits(page)
  await page.goto('/zh/workspace')
  await page.getByRole('button', { name: '新建项目' }).click()
  await expect(page.getByRole('heading', { name: '创建项目' })).toBeVisible()
  await page.getByPlaceholder('未命名项目').fill(`Agent E2E ${Date.now()}`)
  const submitButton = page.getByRole('button', { name: '创建项目' }).last()
  await expect(submitButton).toBeEnabled()
  await submitButton.click()
  await expect(page).toHaveURL(/\/zh\/canvas\/[^/]+$/, { timeout: 15000 })
}

export async function createProjectWithTemplate(page: Page, templateName = '电商商品图起手模板') {
  await page.goto('/zh/workspace')
  await page.getByRole('button', { name: '新建项目' }).click()
  await expect(page.getByRole('heading', { name: '创建项目' })).toBeVisible()
  await page.getByPlaceholder('未命名项目').fill(`Agent Template E2E ${Date.now()}`)
  await page.getByRole('button', { name: templateName }).click()
  const submitButton = page.getByRole('button', { name: '创建项目' }).last()
  await expect(submitButton).toBeEnabled()
  await submitButton.click()
  await expect(page).toHaveURL(/\/zh\/canvas\/[^/]+$/, { timeout: 15000 })
}

export async function createProjectWithImageWorkflow(page: Page) {
  await ensureAgentCredits(page)
  const workflowData = JSON.stringify({
    version: 1,
    name: `Agent Image Workflow E2E ${Date.now()}`,
    nodes: [
      {
        id: 'text-input-1',
        type: 'text-input',
        position: { x: 80, y: 160 },
        data: {
          label: 'Text Input',
          type: 'input',
          status: 'idle',
          config: {
            text: '请生成一张电商海报图片',
          },
        },
      },
      {
        id: 'image-gen-1',
        type: 'image-gen',
        position: { x: 360, y: 160 },
        data: {
          label: 'Image Gen',
          type: 'ai-model',
          status: 'idle',
          config: {
            platformProvider: 'openrouter',
            platformModel: 'openai/dall-e-3',
            size: 'auto',
            aspectRatio: '1:1',
            showPreview: false,
          },
        },
      },
      {
        id: 'display-1',
        type: 'display',
        position: { x: 660, y: 160 },
        data: {
          label: 'Display',
          type: 'output',
          status: 'idle',
          config: {},
        },
      },
    ],
    edges: [
      {
        id: 'edge-text-image',
        source: 'text-input-1',
        sourceHandle: 'text-out',
        target: 'image-gen-1',
        targetHandle: 'prompt-in',
        type: 'custom',
      },
      {
        id: 'edge-image-display',
        source: 'image-gen-1',
        sourceHandle: 'image-out',
        target: 'display-1',
        targetHandle: 'content-in',
        type: 'custom',
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    savedAt: new Date().toISOString(),
  })

  const createResponse = await page.request.post('/api/workflows', {
    data: {
      name: `Agent Image Workflow E2E ${Date.now()}`,
      data: workflowData,
    },
  })
  expect(createResponse.ok()).toBeTruthy()
  const createPayload = await createResponse.json()
  const workflowId = createPayload?.data?.id as string | undefined
  if (!workflowId) {
    throw new Error('Create workflow response is missing id')
  }

  await page.goto(`/zh/canvas/${workflowId}`)
  await expect(getCanvasNode(page, 'Image Gen')).toBeVisible({ timeout: 20000 })
}

export async function createProjectWithResultAsset(page: Page) {
  await ensureAgentCredits(page)
  const workflowData = JSON.stringify({
    version: 1,
    name: `Agent Result E2E ${Date.now()}`,
    nodes: [
      {
        id: 'text-input-1',
        type: 'text-input',
        position: { x: 80, y: 160 },
        data: {
          label: 'Text Input',
          type: 'input',
          status: 'idle',
          config: {
            text: '请生成一张适合电商海报的商品主图',
          },
        },
      },
      {
        id: 'image-gen-1',
        type: 'image-gen',
        position: { x: 360, y: 160 },
        data: {
          label: 'Image Gen',
          type: 'ai-model',
          status: 'idle',
          config: {
            platformProvider: 'openrouter',
            platformModel: 'openai/dall-e-3',
            size: 'auto',
            aspectRatio: '1:1',
            showPreview: true,
            resultUrl: 'https://cdn.example.com/agent-e2e-result.png',
          },
        },
      },
      {
        id: 'display-1',
        type: 'display',
        position: { x: 660, y: 160 },
        data: {
          label: 'Display',
          type: 'output',
          status: 'idle',
          config: {},
        },
      },
    ],
    edges: [
      {
        id: 'edge-text-image',
        source: 'text-input-1',
        sourceHandle: 'text-out',
        target: 'image-gen-1',
        targetHandle: 'prompt-in',
        type: 'custom',
      },
      {
        id: 'edge-image-display',
        source: 'image-gen-1',
        sourceHandle: 'image-out',
        target: 'display-1',
        targetHandle: 'content-in',
        type: 'custom',
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    savedAt: new Date().toISOString(),
  })

  const createResponse = await page.request.post('/api/workflows', {
    data: {
      name: `Agent Result E2E ${Date.now()}`,
      data: workflowData,
    },
  })
  expect(createResponse.ok()).toBeTruthy()
  const createPayload = await createResponse.json()
  const workflowId = createPayload?.data?.id as string | undefined
  if (!workflowId) {
    throw new Error('Create workflow response is missing id')
  }

  await page.goto(`/zh/canvas/${workflowId}`)
  await expect(getAgentPanel(page).getByRole('button', { name: '我想生成一张小猫的图片' })).toBeVisible()
}
