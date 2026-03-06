/**
 * [INPUT]: 依赖 vitest，依赖 ./pricing，依赖 @/lib/errors
 * [OUTPUT]: pricing 模块的单元测试
 * [POS]: lib/credits 的定价查询 + 权限校验测试
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'
import { checkModelAccess } from './pricing'

describe('checkModelAccess', () => {
  it('allows free user to access free model', () => {
    expect(() => checkModelAccess('free', 'free')).not.toThrow()
  })

  it('allows standard user to access free model', () => {
    expect(() => checkModelAccess('standard', 'free')).not.toThrow()
  })

  it('allows pro user to access standard model', () => {
    expect(() => checkModelAccess('pro', 'standard')).not.toThrow()
  })

  it('allows ultimate user to access any model', () => {
    expect(() => checkModelAccess('ultimate', 'ultimate')).not.toThrow()
    expect(() => checkModelAccess('ultimate', 'pro')).not.toThrow()
    expect(() => checkModelAccess('ultimate', 'standard')).not.toThrow()
    expect(() => checkModelAccess('ultimate', 'free')).not.toThrow()
  })

  it('blocks free user from standard model', () => {
    expect(() => checkModelAccess('free', 'standard')).toThrow('standard plan or above')
  })

  it('blocks free user from pro model', () => {
    expect(() => checkModelAccess('free', 'pro')).toThrow('pro plan or above')
  })

  it('blocks standard user from pro model', () => {
    expect(() => checkModelAccess('standard', 'pro')).toThrow('pro plan or above')
  })

  it('blocks standard user from ultimate model', () => {
    expect(() => checkModelAccess('standard', 'ultimate')).toThrow('ultimate plan or above')
  })

  it('treats unknown plan as free', () => {
    expect(() => checkModelAccess('unknown', 'free')).not.toThrow()
    expect(() => checkModelAccess('unknown', 'standard')).toThrow()
  })
})
