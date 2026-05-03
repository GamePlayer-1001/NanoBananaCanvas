/**
 * [INPUT]: 依赖 vitest，依赖 ./create-node
 * [OUTPUT]: createNode 单元测试
 * [POS]: lib/utils 的节点工厂测试
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { createNode } from './create-node'

/* ─── Tests ──────────────────────────────────────────── */

describe('createNode', () => {
  it('creates text-input with correct defaults', () => {
    const node = createNode('text-input', { x: 100, y: 200 })
    expect(node.type).toBe('text-input')
    expect(node.position).toEqual({ x: 100, y: 200 })
    expect(node.data.label).toBe('Text Input')
    expect(node.data.type).toBe('input')
    expect(node.data.config).toEqual({ text: '' })
    expect(node.data.status).toBe('idle')
  })

  it('creates image-input with correct defaults', () => {
    const node = createNode('image-input', { x: 80, y: 60 })
    expect(node.type).toBe('image-input')
    expect(node.data.label).toBe('Image Input')
    expect(node.data.type).toBe('input')
    expect(node.data.config).toEqual({ imageUrl: '' })
  })

  it('creates llm with correct defaults', () => {
    const node = createNode('llm', { x: 0, y: 0 })
    expect(node.type).toBe('llm')
    expect(node.data.label).toBe('LLM')
    expect(node.data.type).toBe('ai-model')
    expect(node.data.config).toEqual({
      platformProvider: 'comfly',
      platformModel: 'gpt-5.4',
      temperature: 0.7,
    })
  })

  it('creates display with correct defaults', () => {
    const node = createNode('display', { x: 0, y: 0 })
    expect(node.type).toBe('display')
    expect(node.data.label).toBe('Display')
    expect(node.data.type).toBe('output')
    expect(node.data.config).toEqual({})
  })

  it('generates unique IDs for each node', () => {
    const a = createNode('llm', { x: 0, y: 0 })
    const b = createNode('llm', { x: 0, y: 0 })
    expect(a.id).not.toBe(b.id)
  })

  it('falls back gracefully for unknown type', () => {
    const node = createNode('custom-node', { x: 50, y: 50 })
    expect(node.type).toBe('custom-node')
    expect(node.data.label).toBe('custom-node')
    expect(node.data.type).toBe('transform')
    expect(node.data.config).toEqual({})
  })
})
