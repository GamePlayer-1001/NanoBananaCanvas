/**
 * [INPUT]: 依赖 vitest，依赖 ./node-executor
 * [OUTPUT]: executeNode 的核心节点执行测试 (text-input / conditional / loop / 图片任务状态映射)
 * [POS]: lib/executor 的节点执行单测，覆盖基础输入、条件判断、循环拆分边界，以及图片异步任务阶段状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { WorkflowNodeData } from '@/types'

import { executeNode } from './node-executor'

function createContext(
  nodeType: string,
  config: Record<string, unknown>,
  inputs: Record<string, unknown> = {},
  overrides: Record<string, unknown> = {},
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
    ...overrides,
  }
}

describe('executeNode', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

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
      createContext(
        'conditional',
        { operator: '==', compareValue: '3' },
        { 'value-in': 3 },
      ),
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
      createContext(
        'loop',
        { mode: 'forEach', separator: '\\n' },
        { 'items-in': '["a","b","c"]' },
      ),
    )

    expect(result.outputs.__loop_items).toEqual(['a', 'b', 'c'])
    expect(result.outputs['item-out']).toBe('a')
    expect(result.outputs['index-out']).toBe(0)
  })

  it('splits text input by custom separator in loop node', async () => {
    const result = await executeNode(
      createContext(
        'loop',
        { mode: 'forEach', separator: ',' },
        { 'items-in': 'one, two,three' },
      ),
    )

    expect(result.outputs.__loop_items).toEqual(['one', 'two', 'three'])
  })

  it('creates index items in repeat mode', async () => {
    const result = await executeNode(
      createContext('loop', { mode: 'repeat', iterations: 4 }),
    )
    expect(result.outputs.__loop_items).toEqual([0, 1, 2, 3])
  })

  it('passes through display input without forcing string conversion', async () => {
    const payload = {
      type: 'url',
      url: 'https://example.com/demo.png',
      contentType: 'image/png',
    }
    const result = await executeNode(
      createContext('display', {}, { 'content-in': payload }),
    )

    expect(result.outputs.content).toEqual(payload)
  })

  it('merges text inputs in port order with configured separator', async () => {
    const result = await executeNode(
      createContext(
        'text-merge',
        { separator: ' + ' },
        { 'text-2-in': 'B', 'text-1-in': 'A', 'text-4-in': 'D' },
      ),
    )

    expect(result.outputs['text-out']).toBe('A + B + D')
  })

  it('merges image inputs into an ordered image list', async () => {
    const result = await executeNode(
      createContext(
        'image-merge',
        {},
        {
          'image-2-in': '/two.png',
          'image-1-in': '/one.png',
          'image-4-in': '/four.png',
        },
      ),
    )

    expect(result.outputs['images-out']).toEqual(['/one.png', '/two.png', '/four.png'])
  })

  it('maps deferred image task phases to queued, running, and finalizing', async () => {
    vi.useFakeTimers()

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'task-image-1' } }),
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: 'pending', progress: 0, output: null } }),
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: 'running', progress: 62, output: null } }),
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            status: 'completed',
            progress: 100,
            output: { url: '/api/files/outputs/demo/final.png' },
          },
        }),
      } satisfies Partial<Response>)

    vi.stubGlobal('fetch', fetchMock)

    const changes: Array<{ status?: string; configPatch?: Record<string, unknown> }> = []
    const execution = executeNode(
      createContext(
        'image-gen',
        {
          executionMode: 'platform',
          platformProvider: 'openrouter',
          platformModel: 'openai/dall-e-3',
          size: '1k',
          aspectRatio: '1:1',
        },
        { 'prompt-in': 'draw a lighthouse in fog' },
        {
          onTaskStateChange: (change: { status?: string; configPatch?: Record<string, unknown> }) => {
            changes.push(change)
          },
        },
      ),
    )

    await vi.advanceTimersByTimeAsync(15_000)

    const result = await execution
    expect(result.outputs['image-out']).toBe('/api/files/outputs/demo/final.png')
    expect(changes).toEqual([
      { status: 'queued', configPatch: { progress: 0, taskId: 'task-image-1' } },
      { status: 'queued', configPatch: { progress: 0, taskId: 'task-image-1' } },
      { status: 'running', configPatch: { progress: 62, taskId: 'task-image-1' } },
      { status: 'finalizing', configPatch: { progress: 100, taskId: 'task-image-1' } },
    ])
  })
})
