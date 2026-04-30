/**
 * [INPUT]: 依赖 vitest，依赖 summarize-canvas 与 Agent 相关 store
 * [OUTPUT]: 对外提供 summarizeCanvas() 的单元测试，覆盖节点摘要、配置压缩与执行态提炼
 * [POS]: lib/agent 的摘要器回归测试，验证 Agent 上下文输入在典型画布场景下稳定可读
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node } from '@xyflow/react'
import { beforeEach, describe, expect, it } from 'vitest'

import type { WorkflowNodeData } from '@/types'
import { useExecutionStore } from '@/stores/use-execution-store'
import { useFlowStore } from '@/stores/use-flow-store'

import { summarizeCanvas } from './summarize-canvas'

type FlowNode = Node<WorkflowNodeData>

function createNode(
  id: string,
  type: string,
  overrides: Partial<FlowNode> = {},
): FlowNode {
  const { data: overrideData = {}, ...nodeOverrides } = overrides
  const baseNode: FlowNode = {
    id,
    type,
    position: { x: 0, y: 0 },
    selected: false,
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

function createEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle?: string,
  targetHandle?: string,
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'custom',
  }
}

describe('summarizeCanvas', () => {
  beforeEach(() => {
    useFlowStore.setState({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    })
    useExecutionStore.getState().reset()
  })

  it('summarizes selected node context, disconnected nodes and missing display outputs', () => {
    const promptNode = createNode('prompt', 'text-input', {
      selected: true,
      data: {
        label: 'Prompt Writer',
        type: 'input',
        config: {
          text: 'make a poster',
        },
      },
    })
    const imageNode = createNode('image', 'image-gen', {
      data: {
        label: 'Poster Image',
        type: 'ai-model',
        config: {
          prompt: 'cinematic poster',
          size: '1024x1024',
        },
      },
    })
    const noteNode = createNode('note-1', 'note', {
      data: {
        label: 'Loose Note',
        type: 'transform',
        config: {
          text: 'draft ideas',
        },
      },
    })

    const edges = [
      createEdge('edge-1', 'prompt', 'image', 'text-out', 'prompt-in'),
    ]

    const summary = summarizeCanvas({
      workflowId: 'wf_1',
      workflowName: 'Poster Workflow',
      nodes: [promptNode, imageNode, noteNode],
      edges,
    })

    expect(summary.workflowId).toBe('wf_1')
    expect(summary.workflowName).toBe('Poster Workflow')
    expect(summary.nodeCount).toBe(3)
    expect(summary.edgeCount).toBe(1)
    expect(summary.workflowGoal).toBe('Poster Image 为当前工作流的核心产出节点。')
    expect(summary.selectedNodeId).toBe('prompt')
    expect(summary.selectedNodeType).toBe('text-input')
    expect(summary.selectedNodeLabel).toBe('Prompt Writer')
    expect(summary.selectionContext).toMatchObject({
      nodeId: 'prompt',
      nodeType: 'text-input',
      nodeLabel: 'Prompt Writer',
      keyConfig: {
        text: 'make a poster',
      },
      executionStatus: 'idle',
    })
    expect(summary.disconnectedNodeIds).toEqual(['note-1'])
    expect(summary.displayMissingForNodeIds).toEqual(['image'])
    expect(summary.nodes[0]).toMatchObject({
      id: 'prompt',
      label: 'Prompt Writer',
      type: 'text-input',
    })
    expect(summary.nodes[1]?.inputs.map((item) => item.id)).toEqual(['prompt-in', 'image-in'])
    expect(summary.nodes[1]?.outputs.map((item) => item.id)).toEqual(['image-out'])
    expect(summary.subchains?.[0]?.summary).toContain('Prompt Writer -> Poster Image')
  })

  it('compresses whitelisted text fields and drops noisy non-whitelisted structured config', () => {
    const summary = summarizeCanvas({
      workflowId: 'wf_2',
      nodes: [
        createNode('llm-1', 'llm', {
          data: {
            label: 'LLM Node',
            type: 'ai-model',
            config: {
              text: `${'very long prompt '.repeat(20)}tail`,
              prompt: `${'refined scene description '.repeat(20)}tail`,
              iterations: 8,
              hiddenSecret: 'keep-me',
              nested: {
                foo: 'bar',
                deep: 'value',
                extra: 'field',
                other: 'trimmed',
                overflow: 'cut',
              },
              list: ['a', 'b', 'c', 'd', 'e'],
            },
          },
        }),
      ],
      edges: [],
    })

    const configSummary = summary.nodes[0]?.configSummary ?? {}

    expect(typeof configSummary.text).toBe('string')
    expect(String(configSummary.text).length).toBeLessThanOrEqual(163)
    expect(configSummary.text).toMatch(/\.\.\.$/)
    expect(typeof configSummary.prompt).toBe('string')
    expect(String(configSummary.prompt).length).toBeLessThanOrEqual(163)
    expect(configSummary.prompt).toMatch(/\.\.\.$/)
    expect(configSummary.iterations).toBe(8)
    expect(configSummary.hiddenSecret).toBe('keep-me')
    expect(configSummary).not.toHaveProperty('nested')
    expect(configSummary).not.toHaveProperty('list')
  })

  it('returns running and failed execution summaries from execution store state', () => {
    useExecutionStore.getState().startExecution(['prompt', 'image'])
    useExecutionStore.getState().setCurrentNode('image')

    const runningSummary = summarizeCanvas({
      workflowId: 'wf_3',
      nodes: [createNode('prompt', 'text-input'), createNode('image', 'image-gen')],
      edges: [],
    })

    expect(runningSummary.latestExecution).toEqual({
      status: 'running',
      failedNodeId: 'image',
    })

    useExecutionStore.getState().failExecution('Provider timeout')

    const failedSummary = summarizeCanvas({
      workflowId: 'wf_3',
      nodes: [createNode('prompt', 'text-input'), createNode('image', 'image-gen')],
      edges: [],
    })

    expect(failedSummary.latestExecution).toEqual({
      status: 'failed',
      failedReason: 'Provider timeout',
    })
  })

  it('returns completed execution summary when node results exist without active errors', () => {
    useExecutionStore.getState().setNodeResult('display', {
      text: 'done',
    })

    const summary = summarizeCanvas({
      workflowId: 'wf_4',
      nodes: [createNode('display', 'display')],
      edges: [],
    })

    expect(summary.latestExecution).toEqual({
      status: 'completed',
    })
    expect(summary.selectionContext).toBeUndefined()
  })

  it('captures selected node latest result summary and execution hint', () => {
    useExecutionStore.getState().setNodeResult('image', {
      'image-out': 'https://cdn.example.com/result.png',
    })

    const summary = summarizeCanvas({
      workflowId: 'wf_5',
      nodes: [
        createNode('image', 'image-gen', {
          selected: true,
          data: {
            label: 'Hero Image',
            type: 'ai-model',
            config: {
              prompt: 'hero banner',
              platformModel: 'openai/dall-e-3',
              resultUrl: 'https://cdn.example.com/result.png',
            },
          },
        }),
      ],
      edges: [],
    })

    expect(summary.selectionContext).toMatchObject({
      nodeId: 'image',
      latestResultKind: 'image',
      executionStatus: 'completed',
    })
    expect(summary.selectionContext?.latestResultSummary).toContain('Hero Image')
    expect(summary.selectionContext?.executionHint).toBe('这个节点最近已经产出过结果。')
    expect(summary.assetSummary).toContain('1 个图片结果')
    expect(summary.recentTimeline?.at(-1)?.summary).toContain('Hero Image')
  })

  it('collects optimization signals for cost, speed and structural redundancy', () => {
    const llmA = createNode('llm-a', 'llm', {
      data: {
        label: 'Planner A',
        type: 'ai-model',
        config: {
          text: 'same prompt',
          platformProvider: 'openrouter',
          platformModel: 'openai/gpt-4o',
        },
      },
    })
    const llmB = createNode('llm-b', 'llm', {
      data: {
        label: 'Planner B',
        type: 'ai-model',
        config: {
          text: 'same prompt',
          platformProvider: 'openrouter',
          platformModel: 'openai/gpt-4o',
        },
      },
    })
    const video = createNode('video-1', 'video-gen', {
      data: {
        label: 'Video',
        type: 'ai-model',
        config: {
          platformProvider: 'kling',
          platformModel: 'kling-v2-0',
          duration: '10',
          showPreview: true,
        },
      },
    })
    const display = createNode('display-1', 'display', {
      data: {
        label: 'Display',
        type: 'output',
        config: {},
      },
    })

    const summary = summarizeCanvas({
      workflowId: 'wf_5',
      nodes: [llmA, llmB, video, display],
      edges: [
        createEdge('edge-a', 'llm-a', 'display', 'text-out', 'content-in'),
        createEdge('edge-b', 'llm-b', 'display', 'text-out', 'content-in'),
      ],
    })

    expect(summary.optimizationSignals).toMatchObject({
      aiNodeCount: 3,
      expensiveModelNodeIds: expect.arrayContaining(['llm-a', 'llm-b', 'video-1']),
      slowNodeIds: expect.arrayContaining(['video-1']),
      previewEnabledNodeIds: ['video-1'],
      missingMergeCandidateNodeIds: [],
      estimatedCostLevel: 'high',
      estimatedLatencyLevel: 'medium',
    })
    expect(summary.optimizationSignals?.redundantNodeGroups).toEqual([
      { type: 'llm', nodeIds: ['llm-a', 'llm-b'] },
    ])
    expect(summary.clusters?.some((cluster) => cluster.label === 'ai-model')).toBe(true)
  })

  it('summarizes recent result assets from runtime outputs and generated media urls', () => {
    useExecutionStore.getState().setNodeResult('llm-1', {
      'text-out': 'A polished campaign headline for summer sneakers',
    })

    const summary = summarizeCanvas({
      workflowId: 'wf_6',
      nodes: [
        createNode('llm-1', 'llm', {
          data: {
            label: 'Copywriter',
            type: 'ai-model',
            config: {},
          },
        }),
        createNode('image-1', 'image-gen', {
          data: {
            label: 'Hero Image',
            type: 'ai-model',
            config: {
              resultUrl: 'https://cdn.example.com/assets/hero-shot.png',
            },
          },
        }),
      ],
      edges: [],
    })

    expect(summary.assets).toEqual([
      {
        id: 'llm-1:text',
        kind: 'text',
        sourceNodeId: 'llm-1',
        summary: 'Copywriter 产出了文本结果：A polished campaign headline for summer sneakers',
      },
      {
        id: 'image-1:image',
        kind: 'image',
        sourceNodeId: 'image-1',
        summary: 'Hero Image 输出了 1 个图片资产（已生成文件）。',
      },
    ])
    expect(summary.latestSuccessfulAsset).toEqual({
      id: 'image-1:image',
      kind: 'image',
      sourceNodeId: 'image-1',
      summary: 'Hero Image 输出了 1 个图片资产（已生成文件）。',
    })
  })

  it('builds diagnosis summary and recent timeline from failed execution plus audit trail', () => {
    useExecutionStore.getState().startExecution(['image-1'])
    useExecutionStore.getState().setCurrentNode('image-1')
    useExecutionStore.getState().failExecution('Provider timeout')

    const summary = summarizeCanvas({
      workflowId: 'wf_7',
      nodes: [
        createNode('image-1', 'image-gen', {
          selected: true,
          data: {
            label: 'Image Node',
            type: 'ai-model',
            config: {
              prompt: 'hero shot',
            },
          },
        }),
      ],
      edges: [],
      auditTrail: [
        {
          id: 'audit-1',
          kind: 'template-adapted',
          message: 'Agent 已将模板改造成更偏服装商品图方向。',
          createdAt: '2026-04-30T00:00:00.000Z',
          actor: 'agent',
        },
      ],
    })

    expect(summary.diagnosisSummary).toContain('最近一次执行失败')
    expect(summary.recentTimeline?.some((item) => item.kind === 'template')).toBe(true)
    expect(summary.recentTimeline?.some((item) => item.kind === 'execution')).toBe(true)
  })
})
