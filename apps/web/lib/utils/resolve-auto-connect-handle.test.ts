/**
 * [INPUT]: 依赖 vitest，依赖 ./resolve-auto-connect-handle
 * [OUTPUT]: resolveAutoConnectTargetHandle 单元测试
 * [POS]: lib/utils 的自动连线推断测试，覆盖拖线创建节点时的目标输入口选择
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { resolveAutoConnectTargetHandle } from './resolve-auto-connect-handle'

describe('resolveAutoConnectTargetHandle', () => {
  it('maps text output to image-gen prompt input', () => {
    expect(
      resolveAutoConnectTargetHandle('text-input', 'text-out', 'image-gen'),
    ).toBe('prompt-in')
  })

  it('maps image output to image-gen reference input', () => {
    expect(
      resolveAutoConnectTargetHandle('image-input', 'image-out', 'image-gen'),
    ).toBe('image-in')
  })

  it('maps text output to display content input', () => {
    expect(
      resolveAutoConnectTargetHandle('llm', 'text-out', 'display'),
    ).toBe('content-in')
  })

  it('prefers the first compatible merge input when multiple handles match', () => {
    expect(
      resolveAutoConnectTargetHandle('text-input', 'text-out', 'text-merge'),
    ).toBe('text-1-in')
  })

  it('returns null for unknown source handles', () => {
    expect(
      resolveAutoConnectTargetHandle('text-input', 'missing-out', 'image-gen'),
    ).toBeNull()
  })

  it('returns null when no compatible input exists', () => {
    expect(
      resolveAutoConnectTargetHandle('image-input', 'image-out', 'audio-gen'),
    ).toBeNull()
  })
})
