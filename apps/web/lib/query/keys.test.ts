/**
 * [INPUT]: 依赖 ./keys 的 queryKeys
 * [OUTPUT]: queryKeys 工厂函数的单元测试
 * [POS]: lib/query 的测试文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { queryKeys } from './keys'

describe('queryKeys', () => {
  it('should generate workflow list key', () => {
    expect(queryKeys.workflows.all).toEqual(['workflows'])
  })

  it('should generate workflow list key with filters', () => {
    const key = queryKeys.workflows.list({ status: 'active' })
    expect(key).toEqual(['workflows', 'list', { status: 'active' }])
  })

  it('should generate workflow detail key', () => {
    const key = queryKeys.workflows.detail('abc-123')
    expect(key).toEqual(['workflows', 'detail', 'abc-123'])
  })

  it('should generate user profile key', () => {
    expect(queryKeys.user.profile()).toEqual(['user', 'profile'])
  })

})
