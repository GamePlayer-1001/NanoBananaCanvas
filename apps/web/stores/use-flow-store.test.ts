/**
 * [INPUT]: 依赖 vitest，依赖 ./use-flow-store
 * [OUTPUT]: useFlowStore 的连线替换行为测试
 * [POS]: stores 的画布状态单测，覆盖同输入端口新边替换旧边
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Node } from '@xyflow/react'
import { beforeEach, describe, expect, it } from 'vitest'

import type { WorkflowNodeData } from '@/types'

import { useFlowStore } from './use-flow-store'

function node(id: string, type: string): Node<WorkflowNodeData> {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { label: id, type: 'input', config: {}, status: 'idle' },
  }
}

describe('useFlowStore connections', () => {
  beforeEach(() => {
    useFlowStore.setState({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } })
  })

  it('replaces the old edge when a new edge targets the same input handle', () => {
    useFlowStore.setState({
      nodes: [
        node('text-a', 'text-input'),
        node('text-b', 'text-input'),
        node('llm', 'llm'),
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    })

    useFlowStore.getState().onConnect({
      source: 'text-a',
      target: 'llm',
      sourceHandle: 'text-out',
      targetHandle: 'prompt-in',
    })
    useFlowStore.getState().onConnect({
      source: 'text-b',
      target: 'llm',
      sourceHandle: 'text-out',
      targetHandle: 'prompt-in',
    })

    expect(useFlowStore.getState().edges).toMatchObject([
      {
        source: 'text-b',
        target: 'llm',
        sourceHandle: 'text-out',
        targetHandle: 'prompt-in',
      },
    ])
  })
})
