/**
 * [INPUT]: 依赖 vitest 与 @testing-library/react，依赖 ./use-agent-session、@/stores/use-agent-store、@/stores/use-flow-store
 * [OUTPUT]: useAgentSession 的确认执行回归测试，覆盖已落图后的 prompt 确认只回填文本并从下游生成节点执行，不重复追加第二套工作流
 * [POS]: hooks 的 Agent 会话回归测试，保护创建类工作流在确认 prompt 后不会重复落图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import type { Node, Edge } from '@xyflow/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { WorkflowNodeData } from '@/types'
import { useAgentStore } from '@/stores/use-agent-store'
import { useFlowStore } from '@/stores/use-flow-store'
import { buildAgentPlan } from '@/lib/agent/build-agent-plan'
import { explainCanvas } from '@/lib/agent/explain-canvas'
import { refinePromptConfirmation } from '@/lib/agent/prompt-confirmation'
import { summarizeCanvas } from '@/lib/agent/summarize-canvas'

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
    useAgentStore.getState().setMode('update')
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
    vi.mocked(buildAgentPlan).mockReset()
    vi.mocked(refinePromptConfirmation).mockReset()
    vi.mocked(refinePromptConfirmation).mockResolvedValue({
      id: 'prompt-refined-1',
      originalIntent: '帮我生成一张小猫的图片',
      visualProposal: '一只可爱的小猫，主体清晰，光线柔和。',
      executionPrompt: '生成一张主体为小猫的高质量图片，强调毛发细节、柔和光线和干净背景。',
      styleOptions: [
        { id: 'realistic', label: '更写实', promptDelta: '强调真实摄影与材质' },
      ],
    })
  })

  it('waits for workflow confirmation before showing prompt confirmation on create plans', async () => {
    vi.mocked(buildAgentPlan).mockResolvedValue({
      plan: {
        id: 'plan-stage-1',
        goal: '帮我生成一张小猫的图片',
        mode: 'create',
        intent: 'create_workflow',
        summary: '先搭一个基础出图工作流',
        reasons: ['空白画板先搭主链'],
        requiresConfirmation: true,
        operations: [
          { type: 'add_node', nodeId: 'draft-text-input', nodeType: 'text-input' },
          { type: 'add_node', nodeId: 'draft-image-gen', nodeType: 'image-gen' },
          { type: 'add_node', nodeId: 'draft-display', nodeType: 'display' },
        ],
        promptConfirmation: {
          id: 'prompt-stage-1',
          originalIntent: '帮我生成一张小猫的图片',
          visualProposal: '一只可爱的小猫',
          executionPrompt: '生成一张以小猫为主角的高质量图片。',
          targetNodeId: 'draft-text-input',
        },
      },
      alternatives: [],
    })
    useAgentStore.getState().resetSession()
    useFlowStore.getState().setFlow([], [])

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('/Workflow 帮我生成一张小猫的图片')
    })

    const storeState = useAgentStore.getState()
    expect(storeState.status).toBe('awaiting-workflow-confirmation')
    expect(
      storeState.messages.some((message) => message.role === 'prompt-confirmation'),
    ).toBe(false)
    expect(storeState.promptConfirmation?.id).toBe('prompt-stage-1')
  })

  it('shows prompt confirmation only after the workflow plan is confirmed and applied', async () => {
    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    useAgentStore.getState().setStatus('awaiting-workflow-confirmation')

    await act(async () => {
      await result.current.sendMessage('我确认')
    })

    await waitFor(() => {
      const storeState = useAgentStore.getState()
      expect(storeState.status).toBe('awaiting-prompt-confirmation')
      expect(storeState.promptConfirmation?.id).toBe('prompt-1')
    })
    expect(executeFromNodeMock).not.toHaveBeenCalled()
  })

  it('confirms prompt without creating a duplicate workflow branch', async () => {
    useAgentStore.getState().setStatus('awaiting-prompt-confirmation')

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

  it('hydrates the connected image-input node with the attached reference image on confirmation', async () => {
    useFlowStore.getState().setFlow(
      [
        createNode('image-input-existing', 'image-input', { imageUrl: '' }),
        createNode('text-existing', 'text-input', { text: '' }),
        createNode('image-existing', 'image-gen'),
        createNode('display-existing', 'display'),
      ],
      [
        createEdge('image-input-existing', 'image-existing', 'image-out', 'image-in'),
        createEdge('text-existing', 'image-existing', 'text-out', 'prompt-in'),
        createEdge('image-existing', 'display-existing', 'image-out', 'content-in'),
      ],
    )
    useAgentStore.getState().setPendingPlan({
      id: 'plan-image-to-image',
      goal: '帮我参考这张图生成新图',
      mode: 'create',
      intent: 'create_workflow',
      summary: '先搭工作流，再确认提示词',
      reasons: ['空白画板先搭主链'],
      requiresConfirmation: false,
      operations: [
        { type: 'add_node', nodeId: 'draft-image-input', nodeType: 'image-input' },
        { type: 'add_node', nodeId: 'draft-text-input', nodeType: 'text-input' },
        { type: 'add_node', nodeId: 'draft-image-gen', nodeType: 'image-gen' },
        { type: 'add_node', nodeId: 'draft-display', nodeType: 'display' },
      ],
      promptConfirmation: {
        id: 'prompt-image',
        originalIntent: '帮我参考这张图生成新图',
        visualProposal: '保留主体关系并调整风格',
        executionPrompt: '保留参考图主体与构图，强化材质、光线与整体氛围，输出一张完成度更高的新图。',
        attachedImageUrls: ['https://example.com/ref.png'],
        targetNodeId: 'text-existing',
      },
    })
    useAgentStore.getState().setStatus('awaiting-prompt-confirmation')

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.confirmPromptAndRun('prompt-image')
    })

    const flowState = useFlowStore.getState()
    expect(flowState.nodes.find((node) => node.id === 'text-existing')?.data.config.text).toBe(
      '保留参考图主体与构图，强化材质、光线与整体氛围，输出一张完成度更高的新图。',
    )
    expect(
      flowState.nodes.find((node) => node.id === 'image-input-existing')?.data.config.imageUrl,
    ).toBe('https://example.com/ref.png')
    expect(executeFromNodeMock).toHaveBeenCalledWith('text-existing')
  })

  it('continues prompt confirmation even when pendingPlan is missing but promptConfirmation remains', async () => {
    useAgentStore.getState().clearPendingPlan()
    useAgentStore.getState().setStatus('awaiting-prompt-confirmation')

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
    useAgentStore.getState().setStatus('awaiting-prompt-confirmation')

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

  it('does not mistake normal follow-up chat for a confirmation command', async () => {
    useAgentStore.getState().setStatus('awaiting-prompt-confirmation')
    const previousMessageCount = useAgentStore.getState().messages.length

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('好了，现在你再给我看看你润色的文案？')
    })

    expect(executeFromNodeMock).not.toHaveBeenCalled()
    expect(buildAgentPlan).not.toHaveBeenCalled()
    expect(useAgentStore.getState().messages.length).toBeGreaterThan(previousMessageCount)
    expect(
      useAgentStore
        .getState()
        .messages.some((message) => message.role === 'assistant' || message.role === 'proposal'),
    ).toBe(true)
  })

  it('uses /Prompt as a pure prompt workshop command without building a workflow plan', async () => {
    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('/Prompt 帮我生成一张小猫的图片')
    })

    expect(buildAgentPlan).not.toHaveBeenCalled()
    expect(refinePromptConfirmation).toHaveBeenCalled()
    expect(
      useAgentStore.getState().messages.some((message) => message.role === 'prompt-result'),
    ).toBe(true)
    expect(useAgentStore.getState().pendingPlan).toBeNull()
    expect(useAgentStore.getState().status).toBe('idle')
  })

  it('keeps plain chat in chat mode and does not generate workflow plans', async () => {
    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('你好，今天我们先聊聊这个项目该怎么推进')
    })

    expect(buildAgentPlan).not.toHaveBeenCalled()
    expect(
      useAgentStore.getState().messages.some((message) => message.role === 'assistant'),
    ).toBe(true)
    expect(useAgentStore.getState().pendingPlan).toBeNull()
  })

  it('fills the only text-input node in chat mode when the user explicitly asks to write text', async () => {
    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('把这段文案放到文本输入节点："今天主打夏日清爽感海报"')
    })

    expect(buildAgentPlan).not.toHaveBeenCalled()
    expect(useFlowStore.getState().nodes.find((node) => node.id === 'text-existing')?.data.config.text).toBe(
      '今天主打夏日清爽感海报',
    )
  })

  it('fills the only image-input node in chat mode when the user explicitly asks to place an image', async () => {
    useFlowStore.getState().setFlow(
      [
        createNode('image-input-existing', 'image-input', { imageUrl: '' }),
        createNode('image-existing', 'image-gen'),
      ],
      [createEdge('image-input-existing', 'image-existing', 'image-out', 'image-in')],
    )

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage(
        '把这张图放到图片输入节点',
        undefined,
        [{ kind: 'image', url: 'https://example.com/chat-fill.png', name: 'chat-fill.png' }],
      )
    })

    expect(buildAgentPlan).not.toHaveBeenCalled()
    expect(
      useFlowStore.getState().nodes.find((node) => node.id === 'image-input-existing')?.data.config
        .imageUrl,
    ).toBe('https://example.com/chat-fill.png')
  })

  it('does not fill text-input nodes in chat mode when multiple candidates make the target ambiguous', async () => {
    useFlowStore.getState().setFlow(
      [
        createNode('text-1', 'text-input', { text: '' }),
        createNode('text-2', 'text-input', { text: '' }),
      ],
      [],
    )

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('把这段文案放进去：双节点时不要乱填')
    })

    expect(useFlowStore.getState().nodes.find((node) => node.id === 'text-1')?.data.config.text).toBe(
      '',
    )
    expect(useFlowStore.getState().nodes.find((node) => node.id === 'text-2')?.data.config.text).toBe(
      '',
    )
    expect(
      useAgentStore.getState().messages.some(
        (message) =>
          message.role === 'assistant' &&
          message.text.includes('当前有多个文本输入节点'),
      ),
    ).toBe(true)
  })

  it('answers around the selected node in chat mode when the user asks about that node', async () => {
    vi.mocked(summarizeCanvas).mockReturnValueOnce({
      workflowId: 'workflow-1',
      nodeCount: 3,
      edgeCount: 2,
      nodes: [],
      disconnectedNodeIds: [],
      displayMissingForNodeIds: [],
      latestExecution: { status: 'idle' },
      selectionContext: {
        nodeId: 'image-existing',
        nodeType: 'image-gen',
        nodeLabel: '主图生成',
      },
    })
    vi.mocked(explainCanvas).mockResolvedValue('当前选中的节点是主图生成，负责根据 prompt 产出图片。')

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('主图生成这个节点是做什么的？')
    })

    expect(explainCanvas).toHaveBeenCalled()
    expect(buildAgentPlan).not.toHaveBeenCalled()
  })

  it('keeps selected-node collaboration in scoped chat mode without generating workflow plans', async () => {
    vi.mocked(summarizeCanvas).mockReturnValueOnce({
      workflowId: 'workflow-1',
      nodeCount: 3,
      edgeCount: 2,
      nodes: [],
      disconnectedNodeIds: [],
      displayMissingForNodeIds: [],
      latestExecution: { status: 'idle' },
      selectionContext: {
        nodeId: 'text-existing',
        nodeType: 'text-input',
        nodeLabel: '提示词输入',
      },
    })

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('这个节点怎么调会更稳定一点？')
    })

    expect(explainCanvas).not.toHaveBeenCalled()
    expect(buildAgentPlan).not.toHaveBeenCalled()
    expect(
      useAgentStore.getState().messages.some((message) => message.role === 'assistant'),
    ).toBe(true)
  })

  it('routes workflow-image references into the workflow planner with reference semantics', async () => {
    vi.mocked(buildAgentPlan).mockResolvedValue({
      plan: {
        id: 'plan-from-reference',
        goal: '参考这张工作流图给我搭一个类似的流程',
        mode: 'create',
        intent: 'create_workflow',
        summary: '按参考图搭基础工作流',
        reasons: ['用户明确要求参考工作流图'],
        requiresConfirmation: true,
        operations: [{ type: 'add_node', nodeId: 'draft-text-input', nodeType: 'text-input' }],
      },
      alternatives: [],
    })
    useAgentStore.getState().resetSession()
    useFlowStore.getState().setFlow([], [])

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage(
        '/Workflow 参考这张工作流图给我搭一个类似的流程',
        undefined,
        [{ kind: 'image', url: 'https://example.com/workflow-reference.png', name: 'workflow-reference.png' }],
      )
    })

    expect(buildAgentPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowReference: 'workflow_reference',
        userMessage: expect.stringContaining('我上传了一张工作流参考图'),
      }),
    )
  })

  it('explains missing text-input targets instead of silently falling back to small talk', async () => {
    useFlowStore.getState().setFlow([createNode('image-existing', 'image-gen')], [])

    const { result } = renderHook(() =>
      useAgentSession({
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        locale: 'zh',
      }),
    )

    await act(async () => {
      await result.current.sendMessage('把这段文案放进文本输入节点：这里只有图片节点')
    })

    expect(buildAgentPlan).not.toHaveBeenCalled()
    expect(
      useAgentStore.getState().messages.some(
        (message) =>
          message.role === 'assistant' &&
          message.text.includes('当前画板里没有可直接写入的文本输入节点'),
      ),
    ).toBe(true)
  })
})
