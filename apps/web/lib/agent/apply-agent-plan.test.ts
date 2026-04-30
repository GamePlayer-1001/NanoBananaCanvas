/**
 * [INPUT]: 依赖 vitest，依赖 apply-agent-plan 与 Flow/History store
 * [OUTPUT]: 对外提供 applyAgentPlan() 的单元测试，覆盖落图成功、执行联动与失败回滚
 * [POS]: lib/agent 的落图应用器回归测试，确保 Agent 真正改图时不会破坏画布真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Node } from '@xyflow/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { useHistoryStore } from '@/stores/use-history-store'

import { applyAgentPlan } from './apply-agent-plan'
import type { AgentPlan } from './types'

type FlowNode = Node<WorkflowNodeData>

function createNode(
  id: string,
  type: string,
  x = 0,
  y = 0,
  overrides: Partial<FlowNode> = {},
): FlowNode {
  const { data: overrideData = {}, ...nodeOverrides } = overrides
  const baseNode: FlowNode = {
    id,
    type,
    position: { x, y },
    data: {
      type: 'input',
      label: id,
      config: {},
      status: 'idle',
    },
  }

  return {
    ...baseNode,
    ...nodeOverrides,
    data: {
      ...baseNode.data,
      ...overrideData,
    },
  }
}

function createPlan(overrides: Partial<AgentPlan> = {}): AgentPlan {
  return {
    id: 'plan_apply',
    goal: 'agent apply test',
    mode: 'update',
    summary: 'test summary',
    reasons: ['test reason'],
    requiresConfirmation: false,
    operations: [],
    ...overrides,
  }
}

describe('applyAgentPlan', () => {
  beforeEach(() => {
    useFlowStore.setState({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    })
    useHistoryStore.setState({
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    })
  })

  it('applies add/connect/focus/run operations and stores a history snapshot', async () => {
    useFlowStore.setState({
      nodes: [createNode('text-1', 'text-input', 40, 50)],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    })

    const randomUuid = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('display-node-id')
    const runWorkflow = vi.fn(async () => undefined)

    const result = await applyAgentPlan(
      createPlan({
        goal: '补一个展示并运行',
        operations: [
          {
            type: 'add_node',
            nodeId: 'draft-display',
            nodeType: 'display',
            initialData: {
              label: 'Result Display',
              config: {
                showPreview: true,
              },
            },
          },
          {
            type: 'connect',
            source: 'text-1',
            target: 'draft-display',
            sourceHandle: 'text-out',
            targetHandle: 'content-in',
          },
          {
            type: 'focus_nodes',
            nodeIds: ['draft-display'],
          },
          {
            type: 'run_workflow',
            scope: 'all',
          },
        ],
      }),
      {
        workflowId: 'wf_apply_1',
        runWorkflow,
      },
    )

    randomUuid.mockRestore()

    const flowState = useFlowStore.getState()
    const addedNode = flowState.nodes.find((node) => node.id === 'display-node-id')
    const addedEdge = flowState.edges.find((edge) => edge.target === 'display-node-id')
    const historyState = useHistoryStore.getState()

    expect(result.ok).toBe(true)
    expect(result.rolledBack).toBe(false)
    expect(result.summary).toContain('新增 display 节点')
    expect(result.summary).toContain('执行当前工作流')
    expect(runWorkflow).toHaveBeenCalledWith('all', undefined)

    expect(addedNode).toBeDefined()
    expect(addedNode?.data.label).toBe('Result Display')
    expect(addedNode?.data.config.showPreview).toBe(true)
    expect(addedNode?.selected).toBe(true)
    expect(addedEdge).toMatchObject({
      source: 'text-1',
      sourceHandle: 'text-out',
      targetHandle: 'content-in',
    })
    expect(flowState.viewport.zoom).not.toBe(1)

    expect(historyState.past).toHaveLength(1)
    expect(historyState.past[0]?.nodes.map((node) => node.id)).toEqual(['text-1'])
  })

  it('updates an existing node config without clobbering untouched config fields', async () => {
    useFlowStore.setState({
      nodes: [
        createNode('llm-1', 'llm', 20, 30, {
          data: {
            label: 'Writer',
            type: 'ai-model',
            config: {
              temperature: 0.7,
              platformModel: 'openai/gpt-4o-mini',
            },
          },
        }),
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    })

    const result = await applyAgentPlan(
      createPlan({
        goal: '更新现有节点配置',
        operations: [
          {
            type: 'update_node_data',
            nodeId: 'llm-1',
            patch: {
              label: 'Writer Updated',
              config: {
                temperature: 0.3,
              },
            },
          },
        ],
      }),
      {
        workflowId: 'wf_apply_1b',
      },
    )

    const updatedNode = useFlowStore.getState().nodes.find((node) => node.id === 'llm-1')

    expect(result.ok).toBe(true)
    expect(updatedNode?.data.label).toBe('Writer Updated')
    expect(updatedNode?.data.config.temperature).toBe(0.3)
    expect(updatedNode?.data.config.platformModel).toBe('openai/gpt-4o-mini')
  })

  it('returns validation errors without mutating the flow or pushing history', async () => {
    useFlowStore.setState({
      nodes: [createNode('text-1', 'text-input')],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    })

    const result = await applyAgentPlan(
      createPlan({
        operations: [
          {
            type: 'remove_node',
            nodeId: 'missing-node',
          },
        ],
      }),
      {
        workflowId: 'wf_apply_2',
      },
    )

    expect(result).toMatchObject({
      ok: false,
      rolledBack: false,
      summary: '目标节点不存在：missing-node',
      error: '目标节点不存在：missing-node',
    })
    expect(useFlowStore.getState().nodes.map((node) => node.id)).toEqual(['text-1'])
    expect(useHistoryStore.getState().past).toHaveLength(0)
  })

  it('rolls back to the original flow when a later operation fails during apply', async () => {
    useFlowStore.setState({
      nodes: [createNode('llm-1', 'llm', 100, 120)],
      edges: [],
      viewport: { x: 10, y: 20, zoom: 0.9 },
    })

    const result = await applyAgentPlan(
      createPlan({
        operations: [
          {
            type: 'remove_node',
            nodeId: 'llm-1',
          },
          {
            type: 'remove_node',
            nodeId: 'llm-1',
          },
        ],
      }),
      {
        workflowId: 'wf_apply_3',
      },
    )

    expect(result.ok).toBe(false)
    expect(result.rolledBack).toBe(true)
    expect(result.summary).toBe('无法删除节点，目标不存在：llm-1')

    const flowState = useFlowStore.getState()
    expect(flowState.nodes.map((node) => node.id)).toEqual(['llm-1'])
    expect(flowState.viewport).toEqual({ x: 10, y: 20, zoom: 0.9 })
    expect(useHistoryStore.getState().past).toHaveLength(1)
  })

  it('supports M6 incremental modifications while preserving the original main chain', async () => {
    useFlowStore.setState({
      nodes: [
        createNode('text-1', 'text-input', 0, 0),
        createNode('image-1', 'image-gen', 260, 0, {
          data: {
            label: 'Image Gen',
            type: 'ai-model',
            config: {
              platformProvider: 'openrouter',
              platformModel: 'openai/dall-e-3',
            },
          },
        }),
        createNode('display-1', 'display', 520, 0),
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'text-1',
          target: 'image-1',
          sourceHandle: 'text-out',
          targetHandle: 'prompt-in',
          type: 'custom',
        },
        {
          id: 'edge-2',
          source: 'image-1',
          target: 'display-1',
          sourceHandle: 'image-out',
          targetHandle: 'content-in',
          type: 'custom',
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    })

    const uuidMock = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('insert-node-id')
      .mockReturnValueOnce('variant-node-id')
      .mockReturnValueOnce('variant-node-id-2')

    const result = await applyAgentPlan(
      createPlan({
        goal: '增量改造现有工作流',
        operations: [
          {
            type: 'insert_between',
            source: 'text-1',
            target: 'image-1',
            sourceHandle: 'text-out',
            targetHandle: 'prompt-in',
            nodeId: 'draft-style-node',
            nodeType: 'llm',
          },
          {
            type: 'replace_node',
            nodeId: 'image-1',
            nextNodeType: 'image-gen',
            configPatch: {
              platformModel: 'google/gemini-2.5-flash-image-preview',
            },
          },
          {
            type: 'batch_update_node_data',
            nodeIds: ['image-1'],
            patch: {
              config: {
                count: 4,
              },
            },
          },
          {
            type: 'relabel_node',
            nodeId: 'image-1',
            label: 'Image Gen x4',
          },
          {
            type: 'annotate_change',
            nodeId: 'image-1',
            note: '保留原主链，只做增量改造',
          },
          {
            type: 'duplicate_node_branch',
            nodeId: 'image-1',
            count: 2,
            strategy: 'style-variants',
          },
        ],
      }),
      {
        workflowId: 'wf_apply_m6',
      },
    )

    uuidMock.mockRestore()

    const flowState = useFlowStore.getState()
    const insertedNode = flowState.nodes.find((node) => node.id === 'insert-node-id')
    const imageNode = flowState.nodes.find((node) => node.id === 'image-1')
    const variantNodes = flowState.nodes.filter((node) => node.id.startsWith('variant-node-id'))

    expect(result.ok).toBe(true)
    expect(result.summary).toContain('插入 llm 节点')
    expect(insertedNode?.type).toBe('llm')
    expect(imageNode?.data.label).toBe('Image Gen x4')
    expect(imageNode?.data.config.platformModel).toBe('google/gemini-2.5-flash-image-preview')
    expect(imageNode?.data.config.count).toBe(4)
    expect(imageNode?.data.config.agentAnnotation).toBe('保留原主链，只做增量改造')
    expect(variantNodes).toHaveLength(2)
    expect(flowState.edges.some((edge) => edge.source === 'text-1' && edge.target === 'insert-node-id')).toBe(true)
    expect(flowState.edges.some((edge) => edge.source === 'insert-node-id' && edge.target === 'image-1')).toBe(true)
    expect(flowState.edges.some((edge) => edge.source === 'image-1' && edge.target === 'display-1')).toBe(true)
  })
})
