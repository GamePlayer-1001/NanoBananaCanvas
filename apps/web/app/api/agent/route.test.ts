/**
 * [INPUT]: 依赖 vitest，依赖 agent 路由模块，mock 认证与稳定 ID 生成
 * [OUTPUT]: 对外提供 Agent API route 回归测试，覆盖 plan/diagnose/explain/refine-prompt 的成功与基础错误路径
 * [POS]: app/api/agent 的路由测试闭环，保护右侧 Agent 面板依赖的四个核心端点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/auth', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/nanoid', () => ({
  nanoid: vi.fn(),
}))

import { requireAuth } from '@/lib/api/auth'
import { nanoid } from '@/lib/nanoid'

import { POST as diagnosePost } from './diagnose/route'
import { POST as explainPost } from './explain/route'
import { POST as planPost } from './plan/route'
import { POST as refinePromptPost } from './refine-prompt/route'
import { POST as templatePlanPost } from './template-plan/route'

function createCanvasSummary(overrides: Record<string, unknown> = {}) {
  return {
    workflowId: 'wf-agent-1',
    workflowName: 'Agent Workflow',
    nodeCount: 0,
    edgeCount: 0,
    nodes: [],
    disconnectedNodeIds: [],
    displayMissingForNodeIds: [],
    latestExecution: {
      status: 'idle',
    },
    ...overrides,
  }
}

describe('POST /api/agent/*', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue({ userId: 'user_agent_1' } as never)
    vi.mocked(nanoid)
      .mockReturnValueOnce('plan-seed')
      .mockReturnValueOnce('prompt-seed')
      .mockReturnValueOnce('refine-seed')
  })

  it('returns a prompt-confirmation image creation plan for image requests on empty canvas', async () => {
    const response = await planPost(
      new Request('http://localhost/api/agent/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userMessage: '帮我生成一张电商海报图片',
          mode: 'create',
          locale: 'zh',
          canvasSummary: createCanvasSummary(),
        }),
      }),
    )

    expect(response.status).toBe(200)

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        plan: {
          id: 'plan_prompt-seed',
          mode: 'create',
          requiresConfirmation: true,
          operations: expect.arrayContaining([
            expect.objectContaining({ type: 'add_node', nodeType: 'text-input' }),
            expect.objectContaining({ type: 'add_node', nodeType: 'image-gen' }),
            expect.objectContaining({ type: 'request_prompt_confirmation' }),
          ]),
          promptConfirmation: expect.objectContaining({
            id: 'prompt_plan-seed',
            targetNodeId: 'draft-text-input',
          }),
        },
      },
    })
  })

  it('returns an incremental replace-model plan for existing image workflows', async () => {
    const response = await planPost(
      new Request('http://localhost/api/agent/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userMessage: '把这个图片节点换成更便宜的模型',
          mode: 'update',
          locale: 'zh',
          canvasSummary: createCanvasSummary({
            nodeCount: 2,
            edgeCount: 1,
            selectedNodeId: 'image-1',
            selectedNodeType: 'image-gen',
            nodes: [
              {
                id: 'image-1',
                type: 'image-gen',
                label: '图片生成',
                inputs: [{ id: 'prompt-in', label: 'Prompt', type: 'string' }],
                outputs: [{ id: 'image-out', label: 'Image', type: 'image' }],
                configSummary: {
                  platformProvider: 'openrouter',
                  platformModel: 'openai/dall-e-3',
                },
              },
              {
                id: 'display-1',
                type: 'display',
                label: '结果展示',
                inputs: [{ id: 'content-in', label: 'Content', type: 'any' }],
                outputs: [],
                configSummary: {},
              },
            ],
          }),
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        plan: {
          mode: 'update',
          intent: 'replace_model',
          operations: expect.arrayContaining([
            expect.objectContaining({
              type: 'replace_node',
              nodeId: 'image-1',
            }),
          ]),
        },
      },
    })
  })

  it('returns validation failure for malformed plan request payload', async () => {
    const response = await planPost(
      new Request('http://localhost/api/agent/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'create',
          locale: 'zh',
          canvasSummary: createCanvasSummary(),
        }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: 'VALIDATION_FAILED',
      },
    })
  })

  it('returns diagnosis focused on failed execution context', async () => {
    const response = await diagnosePost(
      new Request('http://localhost/api/agent/diagnose', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userMessage: '为什么这条链跑不通？',
          locale: 'zh',
          canvasSummary: createCanvasSummary({
            nodeCount: 2,
            edgeCount: 1,
            latestExecution: {
              status: 'failed',
              failedNodeId: 'image-1',
              failedReason: 'Provider timeout',
            },
          }),
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        diagnosis: {
          summary: '我定位到最近一次失败主要卡在 image-1。',
          affectedNodeIds: ['image-1'],
          suggestedOperations: [
            {
              type: 'focus_nodes',
              nodeIds: ['image-1'],
            },
          ],
        },
      },
    })
  })

  it('returns selected-node explanation when selection context exists', async () => {
    const response = await explainPost(
      new Request('http://localhost/api/agent/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userMessage: '解释一下这个节点',
          locale: 'zh',
          canvasSummary: createCanvasSummary({
            nodeCount: 1,
            selectedNodeId: 'llm-1',
            nodes: [
              {
                id: 'llm-1',
                type: 'llm',
                label: '文案生成',
                inputs: [{ id: 'prompt-in', label: 'Prompt', type: 'string' }],
                outputs: [{ id: 'text-out', label: 'Response', type: 'string' }],
                configSummary: {},
              },
            ],
          }),
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        answer: expect.stringContaining('当前选中的节点是“文案生成”。'),
      },
    })
  })

  it('returns a template adaptation plan when template context exists', async () => {
    const response = await templatePlanPost(
      new Request('http://localhost/api/agent/template-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userMessage: '把它改成适合服装商品的方向，并输出 4 个版本',
          mode: 'template',
          locale: 'zh',
          canvasSummary: createCanvasSummary({
            nodeCount: 4,
            edgeCount: 3,
            nodes: [
              {
                id: 'prompt-1',
                type: 'llm',
                label: '电商视觉规划',
                inputs: [{ id: 'prompt-in', label: 'Prompt', type: 'string' }],
                outputs: [{ id: 'text-out', label: 'Response', type: 'string' }],
                configSummary: {},
              },
              {
                id: 'image-1',
                type: 'image-gen',
                label: '商品主图生成',
                inputs: [{ id: 'prompt-in', label: 'Prompt', type: 'string' }],
                outputs: [{ id: 'image-out', label: 'Image', type: 'image' }],
                configSummary: {},
              },
            ],
            template: {
              id: 'tpl_ecom_image_launch',
              key: 'ecom-image-launch',
              name: '电商商品图起手模板',
              description: 'desc',
              goal: 'goal',
              category: 'image-commerce',
              targetAudience: ['电商运营'],
              applicableIndustries: ['服装'],
              recommendedStyles: ['写实商业'],
              defaultPrompt: 'prompt',
              defaultModel: 'openai/dall-e-3',
              defaultOutputSpec: {
                modality: 'image',
                count: 4,
                aspectRatio: '1:1',
              },
              source: 'system-template',
            },
            auditTrail: [],
          }),
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        plan: {
          mode: 'template',
          intent: 'adapt_template',
          templateContext: {
            sourceTemplate: {
              id: 'tpl_ecom_image_launch',
            },
            adaptationDirection: expect.stringContaining('服装商品'),
          },
          operations: expect.arrayContaining([
            expect.objectContaining({ type: 'update_node_data', nodeId: 'prompt-1' }),
            expect.objectContaining({ type: 'batch_update_node_data', nodeIds: ['image-1'] }),
          ]),
        },
      },
    })
  })

  it('returns prompt refinement payload with style direction and regenerate hint', async () => {
    const response = await refinePromptPost(
      new Request('http://localhost/api/agent/refine-prompt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          originalIntent: '一个男孩在球场打篮球',
          executionPrompt: 'A boy playing basketball on a court',
          styleDirection: '更写实',
          regenerate: true,
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        payload: {
          id: expect.any(String),
          originalIntent: '一个男孩在球场打篮球',
          visualProposal: expect.stringContaining('我重新整理了一版画面方向'),
          executionPrompt: expect.stringContaining('风格方向：更写实'),
          styleOptions: expect.arrayContaining([
            expect.objectContaining({ id: 'realistic', label: '更写实' }),
          ]),
        },
      },
    })
  })
})
