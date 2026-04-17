/**
 * [INPUT]: 依赖 vitest，依赖 ./ai-node-config
 * [OUTPUT]: AI 节点配置解析测试，覆盖新字段优先级、旧字段兼容、平台/用户模式隔离
 * [POS]: lib 的配置语义层单测，防止 platformProvider 与 capability 再次混用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import {
  getNodeConfigMigrationPatch,
  resolveAvailableUserConfigId,
  resolveNodeExecutionTarget,
  resolvePlatformProvider,
} from './ai-node-config'

describe('ai-node-config', () => {
  it('prefers explicit platform fields over legacy provider/model', () => {
    const target = resolveNodeExecutionTarget('llm', {
      executionMode: 'platform',
      provider: 'text',
      model: 'legacy-model',
      platformProvider: 'gemini',
      platformModel: 'gemini-2.5-flash',
    })

    expect(target.provider).toBe('gemini')
    expect(target.modelId).toBe('gemini-2.5-flash')
  })

  it('falls back to legacy provider for old platform workflows', () => {
    expect(
      resolvePlatformProvider('image-gen', {
        executionMode: 'platform',
        provider: 'openrouter',
      }),
    ).toBe('openrouter')
  })

  it('ignores capability placeholder when resolving platform provider', () => {
    expect(
      resolvePlatformProvider('video-gen', {
        executionMode: 'user_key',
        provider: 'video',
      }),
    ).toBe('kling')
  })

  it('returns capability and config id for user key execution', () => {
    const target = resolveNodeExecutionTarget('audio-gen', {
      executionMode: 'user_key',
      userKeyConfigId: 'cfg-audio',
      platformProvider: 'openai',
      platformModel: 'tts-1',
    })

    expect(target.executionMode).toBe('user_key')
    expect(target.capability).toBe('audio')
    expect(target.provider).toBeUndefined()
    expect(target.configId).toBe('cfg-audio')
  })

  it('falls back to the first available config id when stored id is stale', () => {
    expect(
      resolveAvailableUserConfigId(
        { executionMode: 'user_key', userKeyConfigId: 'cfg-missing' },
        ['cfg-image-a', 'cfg-image-b'],
      ),
    ).toBe('cfg-image-a')
  })

  it('returns undefined when no available config ids exist', () => {
    expect(resolveAvailableUserConfigId({ executionMode: 'user_key' }, [])).toBeUndefined()
  })

  it('generates migration patch for legacy workflows', () => {
    expect(
      getNodeConfigMigrationPatch('llm', {
        executionMode: 'platform',
        provider: 'openrouter',
        model: 'openai/gpt-4o-mini',
      }),
    ).toEqual({
      platformProvider: 'openrouter',
      platformModel: 'openai/gpt-4o-mini',
    })
  })
})
