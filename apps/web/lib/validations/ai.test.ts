/**
 * [INPUT]: 依赖 vitest，依赖 ./ai
 * [OUTPUT]: AI 验证 Schema 的单元测试
 * [POS]: lib/validations 的 AI Schema 测试，验证边界值 + 默认值 + 拒绝非法输入
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'
import { aiExecuteSchema, apiKeySchema, modelsQuerySchema } from './ai'

describe('aiExecuteSchema', () => {
  const validInput = {
    provider: 'openrouter',
    modelId: 'openai/gpt-4o-mini',
    messages: [{ role: 'user' as const, content: 'hello' }],
  }

  it('accepts valid input with defaults', () => {
    const result = aiExecuteSchema.parse(validInput)
    expect(result.executionMode).toBe('credits')
    expect(result.temperature).toBeUndefined()
    expect(result.maxTokens).toBeUndefined()
  })

  it('accepts user_key execution mode', () => {
    const result = aiExecuteSchema.parse({ ...validInput, executionMode: 'user_key' })
    expect(result.executionMode).toBe('user_key')
  })

  it('rejects empty provider', () => {
    expect(() => aiExecuteSchema.parse({ ...validInput, provider: '' })).toThrow()
  })

  it('rejects empty messages array', () => {
    expect(() => aiExecuteSchema.parse({ ...validInput, messages: [] })).toThrow()
  })

  it('rejects invalid role', () => {
    expect(() =>
      aiExecuteSchema.parse({
        ...validInput,
        messages: [{ role: 'invalid', content: 'test' }],
      }),
    ).toThrow()
  })

  it('rejects temperature out of range', () => {
    expect(() => aiExecuteSchema.parse({ ...validInput, temperature: 3 })).toThrow()
    expect(() => aiExecuteSchema.parse({ ...validInput, temperature: -1 })).toThrow()
  })

  it('accepts valid temperature range', () => {
    expect(aiExecuteSchema.parse({ ...validInput, temperature: 0 }).temperature).toBe(0)
    expect(aiExecuteSchema.parse({ ...validInput, temperature: 2 }).temperature).toBe(2)
  })

  it('accepts optional workflowId and nodeId', () => {
    const result = aiExecuteSchema.parse({
      ...validInput,
      workflowId: 'wf-123',
      nodeId: 'nd-456',
    })
    expect(result.workflowId).toBe('wf-123')
    expect(result.nodeId).toBe('nd-456')
  })
})

describe('apiKeySchema', () => {
  it('accepts valid api key', () => {
    const result = apiKeySchema.parse({ apiKey: 'sk-or-v1-xxx' })
    expect(result.apiKey).toBe('sk-or-v1-xxx')
  })

  it('rejects empty api key', () => {
    expect(() => apiKeySchema.parse({ apiKey: '' })).toThrow()
  })

  it('accepts optional label', () => {
    const result = apiKeySchema.parse({ apiKey: 'sk-test', label: 'My Key' })
    expect(result.label).toBe('My Key')
  })
})

describe('modelsQuerySchema', () => {
  it('accepts valid category', () => {
    const result = modelsQuerySchema.parse({ category: 'text' })
    expect(result.category).toBe('text')
  })

  it('accepts all categories', () => {
    for (const cat of ['text', 'image', 'video', 'audio']) {
      expect(modelsQuerySchema.parse({ category: cat }).category).toBe(cat)
    }
  })

  it('rejects invalid category', () => {
    expect(() => modelsQuerySchema.parse({ category: 'xyz' })).toThrow()
  })

  it('allows empty object', () => {
    const result = modelsQuerySchema.parse({})
    expect(result.category).toBeUndefined()
  })
})
