/**
 * [INPUT]: 依赖 vitest，依赖 @xyflow/react 的 Node/Edge 类型，依赖 ./workflow-executor
 * [OUTPUT]: WorkflowExecutor 的条件分支与循环编排测试
 * [POS]: lib/executor 的集成测试，验证分支跳过传播与循环体执行闭环
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it, vi } from 'vitest'
import type { Edge, Node } from '@xyflow/react'

import type { WorkflowNodeData } from '@/types'

import { WorkflowExecutor, type ExecutionCallbacks } from './workflow-executor'

function node(
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
      type: 'transform',
      config,
      status: 'idle',
    },
  }
}

function edge(source: string, target: string, sourceHandle?: string, targetHandle?: string): Edge {
  return {
    id: `${source}-${sourceHandle ?? 'default'}-${target}-${targetHandle ?? 'default'}`,
    source,
    target,
    sourceHandle,
    targetHandle,
  }
}

function createCallbacks() {
  const updates: Array<{ nodeId: string; status: WorkflowNodeData['status'] }> = []
  const completions: Array<{ nodeId: string; outputs: Record<string, unknown> }> = []

  const callbacks: ExecutionCallbacks = {
    onStart: vi.fn(),
    onNodeStart: vi.fn(),
    onNodeComplete: vi.fn((nodeId, outputs) => {
      completions.push({ nodeId, outputs })
    }),
    onNodeError: vi.fn(),
    onStreamChunk: vi.fn(),
    onComplete: vi.fn(),
    onError: vi.fn(),
    updateNodeStatus: vi.fn((nodeId, status) => {
      updates.push({ nodeId, status })
    }),
  }

  return { callbacks, updates, completions }
}

describe('WorkflowExecutor', () => {
  it('skips the false branch and keeps the true branch running', async () => {
    const nodes = [
      node('text', 'text-input', { text: 'go' }),
      node('cond', 'conditional', { operator: '==', compareValue: 'go' }),
      node('trueDisplay', 'display'),
      node('falseDisplay', 'display'),
    ]

    const edges = [
      edge('text', 'cond', 'text-out', 'value-in'),
      edge('cond', 'trueDisplay', 'true-out', 'content-in'),
      edge('cond', 'falseDisplay', 'false-out', 'content-in'),
    ]

    const { callbacks, updates, completions } = createCallbacks()
    const executor = new WorkflowExecutor()

    await executor.execute(nodes, edges, callbacks)

    expect(callbacks.onComplete).toHaveBeenCalled()
    expect(
      updates.some((entry) => entry.nodeId === 'falseDisplay' && entry.status === 'skipped'),
    ).toBe(true)
    expect(
      completions.some(
        (entry) => entry.nodeId === 'trueDisplay' && entry.outputs.content === 'go',
      ),
    ).toBe(true)
    expect(completions.some((entry) => entry.nodeId === 'falseDisplay')).toBe(false)
  })

  it('executes loop body for each item and aggregates terminal outputs', async () => {
    const nodes = [
      node('source', 'text-input', { text: 'A\nB\nC' }),
      node('loop', 'loop', { mode: 'forEach', separator: '\\n' }),
      node('branch', 'conditional', { operator: 'contains', compareValue: 'B' }),
      node('collector', 'display'),
    ]

    const edges = [
      edge('source', 'loop', 'text-out', 'items-in'),
      edge('loop', 'branch', 'item-out', 'value-in'),
      edge('branch', 'collector', 'true-out', 'content-in'),
    ]

    const { callbacks, completions } = createCallbacks()
    const executor = new WorkflowExecutor()

    await executor.execute(nodes, edges, callbacks)

    const loopCompletion = completions.filter((entry) => entry.nodeId === 'loop').at(-1)
    expect(loopCompletion?.outputs['results-out']).toEqual([
      {},
      { content: 'B' },
      {},
    ])
    expect(callbacks.onComplete).toHaveBeenCalled()
  })
})
