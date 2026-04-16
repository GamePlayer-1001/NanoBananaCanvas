/**
 * [INPUT]: 依赖 vitest，依赖 ./response，依赖 @/lib/errors
 * [OUTPUT]: response 模块的单元测试
 * [POS]: lib/api 的响应工具测试，验证 apiOk/apiError/handleApiError + 状态码映射
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'
import { apiOk, apiError, handleApiError } from './response'
import { AppError, ErrorCode, AuthError, ValidationError } from '@/lib/errors'

describe('apiOk', () => {
  it('returns ok: true with data', async () => {
    const res = apiOk({ foo: 'bar' })
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.data).toEqual({ foo: 'bar' })
    expect(res.status).toBe(200)
  })

  it('accepts custom status', async () => {
    const res = apiOk(null, 201)
    expect(res.status).toBe(201)
  })
})

describe('apiError', () => {
  it('returns ok: false with error', async () => {
    const res = apiError('TEST_ERROR', 'something failed', 400)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('TEST_ERROR')
    expect(body.error.message).toBe('something failed')
    expect(res.status).toBe(400)
  })
})

describe('handleApiError', () => {
  it('maps AUTH_UNAUTHORIZED to 401', async () => {
    const err = new AuthError('AUTH_UNAUTHORIZED', 'Not logged in')
    const res = handleApiError(err)
    expect(res.status).toBe(401)
  })

  it('maps AUTH_FORBIDDEN to 403', async () => {
    const err = new AuthError('AUTH_FORBIDDEN', 'No access')
    const res = handleApiError(err)
    expect(res.status).toBe(403)
  })

  it('maps VALIDATION_FAILED to 400', async () => {
    const err = new ValidationError('Bad input')
    const res = handleApiError(err)
    expect(res.status).toBe(400)
  })

  it('maps NOT_FOUND to 404', async () => {
    const err = new AppError(ErrorCode.NOT_FOUND, 'Not found')
    const res = handleApiError(err)
    expect(res.status).toBe(404)
  })

  it('maps CONFLICT to 409', async () => {
    const err = new AppError(ErrorCode.CONFLICT, 'Already exists')
    const res = handleApiError(err)
    expect(res.status).toBe(409)
  })

  it('maps unknown errors to 500', async () => {
    const err = new Error('Random error')
    const res = handleApiError(err)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('UNKNOWN')
  })

  it('handles non-Error objects', async () => {
    const res = handleApiError('string error')
    expect(res.status).toBe(500)
  })
})
