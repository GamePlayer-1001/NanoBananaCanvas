/**
 * [INPUT]: 依赖 vitest，依赖 ./topological-sort
 * [OUTPUT]: topologicalSort 的单元测试
 * [POS]: lib/executor 的排序算法测试，验证正序/空图/环检测
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'
import { topologicalSort } from './topological-sort'

/* ─── Helpers ────────────────────────────────────────── */

const node = (id: string) => ({ id, type: 'test', position: { x: 0, y: 0 }, data: {} })
const edge = (source: string, target: string) => ({
  id: `${source}-${target}`,
  source,
  target,
})

/* ─── Tests ──────────────────────────────────────────── */

describe('topologicalSort', () => {
  it('returns empty array for empty graph', () => {
    expect(topologicalSort([], [])).toEqual([])
  })

  it('returns single node', () => {
    const result = topologicalSort([node('a')], [])
    expect(result).toEqual(['a'])
  })

  it('sorts linear chain: A → B → C', () => {
    const nodes = [node('a'), node('b'), node('c')]
    const edges = [edge('a', 'b'), edge('b', 'c')]

    const result = topologicalSort(nodes, edges)
    expect(result.indexOf('a')).toBeLessThan(result.indexOf('b'))
    expect(result.indexOf('b')).toBeLessThan(result.indexOf('c'))
  })

  it('sorts diamond: A → B, A → C, B → D, C → D', () => {
    const nodes = [node('a'), node('b'), node('c'), node('d')]
    const edges = [edge('a', 'b'), edge('a', 'c'), edge('b', 'd'), edge('c', 'd')]

    const result = topologicalSort(nodes, edges)
    expect(result.indexOf('a')).toBeLessThan(result.indexOf('b'))
    expect(result.indexOf('a')).toBeLessThan(result.indexOf('c'))
    expect(result.indexOf('b')).toBeLessThan(result.indexOf('d'))
    expect(result.indexOf('c')).toBeLessThan(result.indexOf('d'))
  })

  it('handles disconnected nodes', () => {
    const nodes = [node('a'), node('b'), node('c')]
    const edges = [edge('a', 'b')]

    const result = topologicalSort(nodes, edges)
    expect(result).toHaveLength(3)
    expect(result.indexOf('a')).toBeLessThan(result.indexOf('b'))
    expect(result).toContain('c')
  })

  it('finishes the current ready branch before switching to another disconnected root', () => {
    const nodes = [
      node('text-1'),
      node('image-1'),
      node('display-1'),
      node('text-2'),
      node('image-2'),
      node('display-2'),
    ]
    const edges = [
      edge('text-1', 'image-1'),
      edge('image-1', 'display-1'),
      edge('text-2', 'image-2'),
      edge('image-2', 'display-2'),
    ]

    const result = topologicalSort(nodes, edges)
    expect(result).toEqual([
      'text-1',
      'image-1',
      'display-1',
      'text-2',
      'image-2',
      'display-2',
    ])
  })

  it('throws on cycle: A → B → A', () => {
    const nodes = [node('a'), node('b')]
    const edges = [edge('a', 'b'), edge('b', 'a')]

    expect(() => topologicalSort(nodes, edges)).toThrow('Circular dependency')
  })

  it('throws on three-node cycle: A → B → C → A', () => {
    const nodes = [node('a'), node('b'), node('c')]
    const edges = [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')]

    expect(() => topologicalSort(nodes, edges)).toThrow('Circular dependency')
  })

  it('includes cycle node IDs in error metadata', () => {
    const nodes = [node('a'), node('b'), node('c'), node('d')]
    const edges = [edge('a', 'b'), edge('b', 'c'), edge('c', 'b'), edge('a', 'd')]

    try {
      topologicalSort(nodes, edges)
      expect.fail('Should have thrown')
    } catch (err: unknown) {
      const error = err as { meta: { cycleNodes: string[] } }
      expect(error.meta.cycleNodes).toContain('b')
      expect(error.meta.cycleNodes).toContain('c')
    }
  })
})
