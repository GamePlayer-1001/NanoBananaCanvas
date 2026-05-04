/**
 * [INPUT]: 依赖 vitest 与 @testing-library/react，依赖 ./use-agent-session、@/stores/use-agent-store、@/stores/use-flow-store
 * [OUTPUT]: useAgentSession 的确认执行回归测试，覆盖已落图后的 prompt 确认只回填文本并从下游生成节点执行，不重复追加第二套工作流
 * [POS]: hooks 的 Agent 会话回归测试，保护创建类工作流在确认 prompt 后不会重复落图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import type { Node, Edge } from '@xyflow/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { WorkflowNodeData } from '@/types'
import { useAgentStore } from '@/stores/use-agent-store'
import { useFlowStore } from '@/stores/use-flow-store'

const executeMock = vi.fn(async () => undefined)
const executeFromNodeMock = vi.fn(async () => undefined)

vi.mock('next-intl', () => ({
  useTranslations: () => ((key: string) => key) as (key: string) => string,
}))

vi.mock('@/hooks/use-workflow-executor', () => ({
  useWorkflowExecutor: () => ({
    execute: executeMock,
    executeFromNode: executeFromNodeMock,
  }),
}))

vi.mock('@/lib/agent/agent-audit', () => ({
  recordAgentAudit: vi.fn(async () => ({ ok: true })),
}))

vi.mock('@/lib/agent/build-agent-plan', () => ({
  buildAgentPlan: vi.fn(),
}))

vi.mock('@/lib/agent/build-template-plan', () => ({
  buildTemplatePlan: vi.fn(),
}))

vi.mock('@/lib/agent/diagnose-canvas', () => ({
  diagnoseCanvas: vi.fn(),
}))

vi.mock('@/lib/agent/explain-canvas', () => ({
  explainCanvas: vi.fn(),
}))

vi.mock('@/lib/agent/optimize-canvas', () => ({
  optimizeCanvas: vi.fn(),
}))

vi.mock('@/lib/agent/prompt-confirmation', () => ({
  refinePromptConfirmation: vi.fn(),
}))

vi.mock('@/lib/agent/summarize-canvas', () => ({
  summarizeCanvas: vi.fn(() => ({
    workflowId: 'workflow-1',
    nodeCount: 0,
    edgeCount: 0,
    nodes: [],
    disconnectedNodeIds: [],
    displayMissingForNodeIds: [],
    latestExecution: { status: 'idle' },
  })),
}))

import { useAgentSession } from './use-agent-session'

function createNode(
  id: string,
  type: string,
  config: Record<string, unknown> = {},
): Node<WorkflowNodeData> {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: {
      label: id,
      type: 'input',
      status: 'idle',
      config,
    },
  }
}

function createEdge(
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string,
): Edge {
  return {
    id: `${source}-${target}-${targetHandle}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'custom',
  }
}

describe('useAgentSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAgentStore.getState().resetSession()
    useFlowStore.getState().setFlow(
      [
        createNode('text-existing', 'text-input', { text: '' }),
        createNode('image-existing', 'image-gen'),
        createNode('display-existing', 'display'),
      ],
      [
        createEdge('text-existing', 'image-existing', 'text-out', 'prompt-in'),
        createEdge('image-existing', 'display-existing', 'image-out', 'content-in'),
      ],
    )
    useAgentStore.getState().setPendingPlan({
      id: 'plan-create-image',
      goal: '帮我生成一张小猫的图片',
      mode: 'create',
      intent: 'create_workflow',
      summary: '先搭工作流，再确认提示词',
      reasons: ['空白画板先搭主链'],
      requiresConfirmation: false,
      operations: [
        { type: 'add_node', nodeId: 'draft-text-input', nodeType: 'text-input' },
        { type: 'add_node', nodeId: 'draft-image-gen', nodeType: 'image-gen' },
        { type: 'add_node', nodeId: 'draft-display', nodeType: 'display' },
        {
          type: 'connect',
          source: 'draft-text-input',
          sourceHandle: 'text-out',
          target: 'draft-image-gen',
          targetHandle: 'prompt-in',
        },
        {
          type: 'connect',
          source: 'draft-image-gen',
          sourceHandle: 'image-out',
          target: 'draft-display',
          targetHandle: 'content-in',
        },
      ],
      promptConfirmation: {
        id: 'prompt-1',
        originalIntent: '帮我生成一张小猫的图片',
        visualProposal: '一只可爱的小猫',
        executionPrompt: '生成一张以小猫为主角的高质量图片，主体清晰，毛发细节完整。',
        targetNodeId: 'text-existing',
      },
    })
  })

  it('confirms prompt without creating a duplicate workflow branch', async () => {
    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.confirmPromptAndRun('prompt-1')
    })

    const flowState = useFlowStore.getState()
    expect(flowState.nodes).toHaveLength(3)
    expect(flowState.edges).toHaveLength(2)
    expect(flowState.nodes.find((node) => node.id === 'text-existing')?.data.config.text).toBe(
      '生成一张以小猫为主角的高质量图片，主体清晰，毛发细节完整。',
    )
    expect(executeFromNodeMock).toHaveBeenCalledWith('text-existing')
    expect(flowState.nodes.some((node) => node.id === 'draft-text-input')).toBe(false)
    expect(flowState.nodes.some((node) => node.id === 'draft-image-gen')).toBe(false)
  })

  it('continues prompt confirmation even when pendingPlan is missing but promptConfirmation remains', async () => {
    useAgentStore.getState().clearPendingPlan()

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('我确认')
    })

    const flowState = useFlowStore.getState()
    expect(flowState.nodes).toHaveLength(3)
    expect(flowState.edges).toHaveLength(2)
    expect(flowState.nodes.find((node) => node.id === 'text-existing')?.data.config.text).toBe(
      '生成一张以小猫为主角的高质量图片，主体清晰，毛发细节完整。',
    )
    expect(executeFromNodeMock).toHaveBeenCalledWith('text-existing')
  })

  it('treats 我确定 as a conversational prompt confirmation', async () => {
    useAgentStore.getState().clearPendingPlan()

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('我确定')
    })

    const flowState = useFlowStore.getState()
    expect(flowState.nodes.find((node) => node.id === 'text-existing')?.data.config.text).toBe(
      '生成一张以小猫为主角的高质量图片，主体清晰，毛发细节完整。',
    )
    expect(executeFromNodeMock).toHaveBeenCalledWith('text-existing')
  })
})
