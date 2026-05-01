/**
 * [INPUT]: 依赖 vitest，依赖 validate-agent-plan 与 Agent 类型
 * [OUTPUT]: 对外提供 validateAgentPlan() 的单元测试，覆盖白名单校验、确认阈值与连接警告
 * [POS]: lib/agent 的校验器回归测试，确保高风险提案不会绕过本地安全阀
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import type { WorkflowNodeData } from '@/types'

import { validateAgentPlan } from './validate-agent-plan'
import type { AgentPlan } from './types'

type FlowNode = Node<WorkflowNodeData>

function createNode(id: string, type: string): FlowNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: {
      type: 'input',
      label: id,
      config: {},
      status: 'idle',
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

function createPlan(
  overrides: Partial<AgentPlan> = {},
): AgentPlan {
  return {
    id: 'plan_1',
    goal: 'test goal',
    mode: 'update',
    summary: 'test summary',
    reasons: ['test reason'],
    requiresConfirmation: false,
    operations: [],
    ...overrides,
  }
}

describe('validateAgentPlan', () => {
  const nodes = [
    createNode('text-1', 'text-input'),
    createNode('text-2', 'text-input'),
    createNode('llm-1', 'llm'),
    createNode('image-1', 'image-gen'),
    createNode('display-1', 'display'),
  ]

  const edges = [
    createEdge('edge-1', 'text-1', 'llm-1', 'text-out', 'prompt-in'),
  ]

  it('accepts supported low-risk operations without forcing confirmation', () => {
    const plan = createPlan({
      operations: [
        {
          type: 'add_node',
          nodeType: 'display',
        },
        {
          type: 'update_node_data',
          nodeId: 'llm-1',
          patch: {
            config: {
              temperature: 0.3,
            },
          },
        },
      ],
    })

    const result = validateAgentPlan(plan, { nodes, edges })

    expect(result).toEqual({
      ok: true,
      requiresConfirmation: false,
      errors: [],
      warnings: [],
    })
  })

  it('reports hard errors for unknown node types, missing nodes and missing edges', () => {
    const plan = createPlan({
      operations: [
        {
          type: 'add_node',
          nodeType: 'not-registered',
        },
        {
          type: 'update_node_data',
          nodeId: 'missing-node',
          patch: {
            config: { text: 'hello' },
          },
        },
        {
          type: 'remove_node',
          nodeId: 'missing-remove',
        },
        {
          type: 'disconnect',
          edgeId: 'missing-edge',
        },
      ],
    })

    const result = validateAgentPlan(plan, { nodes, edges })

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([
      '未知节点类型：not-registered',
      '目标节点不存在：missing-node',
      '目标节点不存在：missing-remove',
      '目标连线不存在：missing-edge',
    ])
  })

  it('downgrades invalid connect operations to warnings instead of blocking the whole plan', () => {
    const plan = createPlan({
      operations: [
        {
          type: 'connect',
          source: 'image-1',
          target: 'llm-1',
          sourceHandle: 'image-out',
          targetHandle: 'prompt-in',
        },
      ],
    })

    const result = validateAgentPlan(plan, { nodes, edges })

    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([
      '连接 image-1 -> llm-1 需要在真实落图时再确认端口兼容性',
    ])
  })

  it('forces confirmation for destructive, prompt-confirmation and run operations', () => {
    const plan = createPlan({
      operations: [
        {
          type: 'remove_node',
          nodeId: 'llm-1',
        },
        {
          type: 'request_prompt_confirmation',
          payload: {
            id: 'prompt_1',
            originalIntent: 'draw a poster',
            visualProposal: 'poster proposal',
            executionPrompt: 'poster prompt',
          },
        },
        {
          type: 'run_workflow',
          scope: 'all',
        },
      ],
    })

    const result = validateAgentPlan(plan, { nodes, edges })

    expect(result.ok).toBe(true)
    expect(result.requiresConfirmation).toBe(true)
  })

  it('forces confirmation and emits a warning when operation count exceeds the auto-apply threshold', () => {
    const plan = createPlan({
      operations: [
        { type: 'focus_nodes', nodeIds: ['text-1'] },
        { type: 'focus_nodes', nodeIds: ['text-2'] },
        { type: 'focus_nodes', nodeIds: ['llm-1'] },
        { type: 'focus_nodes', nodeIds: ['display-1'] },
        { type: 'focus_nodes', nodeIds: ['text-1', 'llm-1'] },
      ],
    })

    const result = validateAgentPlan(plan, { nodes, edges })

    expect(result.ok).toBe(true)
    expect(result.requiresConfirmation).toBe(true)
    expect(result.warnings).toContain('本次提案包含 5 个操作，超过自动落地阈值')
  })

  it('accepts incremental M6 operations and upgrades risky changes to confirmation', () => {
    const plan = createPlan({
      operations: [
        {
          type: 'insert_between',
          source: 'text-1',
          target: 'llm-1',
          nodeType: 'llm',
          sourceHandle: 'text-out',
          targetHandle: 'prompt-in',
        },
        {
          type: 'replace_node',
          nodeId: 'image-1',
          nextNodeType: 'image-gen',
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
          label: 'Image x4',
        },
      ],
    })

    const result = validateAgentPlan(plan, { nodes, edges })

    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.requiresConfirmation).toBe(true)
  })
})
