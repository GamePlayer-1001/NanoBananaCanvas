/**
 * [INPUT]: 依赖 vitest，依赖 ./validate-connection
 * [OUTPUT]: isValidConnection 单元测试
 * [POS]: lib/utils 的连线验证器测试
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Connection, Edge, Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import type { WorkflowNodeData } from '@/types'

import { isValidConnection } from './validate-connection'

/* ─── Helpers ────────────────────────────────────────── */

function mkNode(id: string, type: string): Node<WorkflowNodeData> {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { label: id, type: 'input', config: {}, status: 'idle' },
  }
}

function mkEdge(src: string, tgt: string, srcH = 'text-out', tgtH = 'prompt-in'): Edge {
  return { id: `${src}-${tgt}`, source: src, target: tgt, sourceHandle: srcH, targetHandle: tgtH }
}

function mkConn(src: string, tgt: string, srcH = 'text-out', tgtH = 'prompt-in'): Connection {
  return { source: src, target: tgt, sourceHandle: srcH, targetHandle: tgtH }
}

/* ─── Tests ──────────────────────────────────────────── */

describe('isValidConnection', () => {
  const nodes = [mkNode('ti', 'text-input'), mkNode('llm', 'llm'), mkNode('disp', 'display')]

  it('allows valid text-input → llm connection', () => {
    expect(isValidConnection(mkConn('ti', 'llm', 'text-out', 'prompt-in'), nodes, [])).toBe(true)
  })

  it('allows valid llm → display connection', () => {
    expect(
      isValidConnection(mkConn('llm', 'disp', 'text-out', 'content-in'), nodes, []),
    ).toBe(true)
  })

  it('rejects self-connection', () => {
    expect(isValidConnection(mkConn('llm', 'llm'), nodes, [])).toBe(false)
  })

  it('rejects duplicate edge', () => {
    const existing = [mkEdge('ti', 'llm')]
    expect(isValidConnection(mkConn('ti', 'llm'), nodes, existing)).toBe(false)
  })

  it('allows same source/target with different handles', () => {
    const existing = [mkEdge('ti', 'llm', 'text-out', 'prompt-in')]
    // different targetHandle → not duplicate
    expect(
      isValidConnection(mkConn('ti', 'llm', 'text-out', 'other-handle'), nodes, existing),
    ).toBe(true)
  })

  it('rejects missing source node', () => {
    expect(isValidConnection(mkConn('ghost', 'llm'), nodes, [])).toBe(false)
  })

  it('allows display (type=any) to accept any source type', () => {
    expect(
      isValidConnection(mkConn('ti', 'disp', 'text-out', 'content-in'), nodes, []),
    ).toBe(true)
  })

  it('allows connection to unknown node types (graceful fallback)', () => {
    const customNodes = [...nodes, mkNode('custom', 'my-custom-node')]
    expect(isValidConnection(mkConn('ti', 'custom', 'text-out', 'any'), customNodes, [])).toBe(
      true,
    )
  })
})
