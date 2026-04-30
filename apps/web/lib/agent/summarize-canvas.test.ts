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
        config: {
          text: 'make a poster',
        },
      },
    })
    const imageNode = createNode('image', 'image-gen', {
      data: {
        label: 'Poster Image',
        config: {
          prompt: 'cinematic poster',
          size: '1024x1024',
        },
      },
    })
    const noteNode = createNode('note-1', 'note', {
      data: {
        label: 'Loose Note',
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
    expect(summary.selectedNodeId).toBe('prompt')
    expect(summary.selectedNodeType).toBe('text-input')
    expect(summary.selectedNodeLabel).toBe('Prompt Writer')
    expect(summary.disconnectedNodeIds).toEqual(['note-1'])
    expect(summary.displayMissingForNodeIds).toEqual(['image'])
    expect(summary.nodes[0]).toMatchObject({
      id: 'prompt',
      label: 'Prompt Writer',
      type: 'text-input',
    })
    expect(summary.nodes[1]?.inputs.map((item) => item.id)).toEqual(['prompt-in', 'image-in'])
    expect(summary.nodes[1]?.outputs.map((item) => item.id)).toEqual(['image-out'])
  })

  it('compresses whitelisted text fields and drops noisy non-whitelisted structured config', () => {
    const summary = summarizeCanvas({
      workflowId: 'wf_2',
      nodes: [
        createNode('llm-1', 'llm', {
          data: {
            label: 'LLM Node',
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
  })
})
