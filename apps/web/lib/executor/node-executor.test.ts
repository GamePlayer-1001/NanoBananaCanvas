/**
 * [INPUT]: 依赖 vitest，依赖 ./node-executor
 * [OUTPUT]: executeNode 的核心节点执行测试 (text-input / conditional / loop)
 * [POS]: lib/executor 的节点执行单测，覆盖基础输入、条件判断、循环拆分边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import type { WorkflowNodeData } from '@/types'

import { executeNode } from './node-executor'

function createContext(
  nodeType: string,
  config: Record<string, unknown>,
  inputs: Record<string, unknown> = {},
) {
  return {
    nodeId: `${nodeType}-1`,
    nodeType,
    data: {
      label: nodeType,
      type: 'transform',
      config,
      status: 'idle',
    } satisfies WorkflowNodeData,
    inputs,
    signal: new AbortController().signal,
  }
}

describe('executeNode', () => {
  it('returns text input as text-out', async () => {
    const result = await executeNode(createContext('text-input', { text: 'hello world' }))
    expect(result.outputs['text-out']).toBe('hello world')
  })

  it('returns uploaded image url as image-out', async () => {
    const result = await executeNode(
      createContext('image-input', { imageUrl: '/api/files/uploads/demo/image.png' }),
    )
    expect(result.outputs['image-out']).toBe('/api/files/uploads/demo/image.png')
  })

  it('supports typed equality in conditional node', async () => {
    const result = await executeNode(
      createContext('conditional', { operator: '==', compareValue: '3' }, { 'value-in': 3 }),
    )

    expect(result.outputs['true-out']).toBe(3)
    expect(result.outputs['false-out']).toBeNull()
  })

  it('supports array contains in conditional node', async () => {
    const result = await executeNode(
      createContext(
        'conditional',
        { operator: 'contains', compareValue: 'beta' },
        { 'value-in': ['alpha', 'beta', 'gamma'] },
      ),
    )

    expect(result.outputs['true-out']).toEqual(['alpha', 'beta', 'gamma'])
  })

  it('supports empty object detection in conditional node', async () => {
    const result = await executeNode(
      createContext('conditional', { operator: 'empty' }, { 'value-in': {} }),
    )

    expect(result.outputs['true-out']).toEqual({})
  })

  it('parses JSON array strings in loop node', async () => {
    const result = await executeNode(
      createContext('loop', { mode: 'forEach', separator: '\\n' }, { 'items-in': '["a","b","c"]' }),
    )

    expect(result.outputs.__loop_items).toEqual(['a', 'b', 'c'])
    expect(result.outputs['item-out']).toBe('a')
    expect(result.outputs['index-out']).toBe(0)
  })

  it('splits text input by custom separator in loop node', async () => {
    const result = await executeNode(
      createContext('loop', { mode: 'forEach', separator: ',' }, { 'items-in': 'one, two,three' }),
    )

    expect(result.outputs.__loop_items).toEqual(['one', 'two', 'three'])
  })

  it('creates index items in repeat mode', async () => {
    const result = await executeNode(createContext('loop', { mode: 'repeat', iterations: 4 }))
    expect(result.outputs.__loop_items).toEqual([0, 1, 2, 3])
  })

  it('passes through display input without forcing string conversion', async () => {
    const payload = { type: 'url', url: 'https://example.com/demo.png', contentType: 'image/png' }
    const result = await executeNode(createContext('display', {}, { 'content-in': payload }))

    expect(result.outputs.content).toEqual(payload)
  })
})
