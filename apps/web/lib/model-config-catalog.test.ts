/**
 * [INPUT]: 依赖 vitest，依赖 ./model-config-catalog 的 provider 目录
 * [OUTPUT]: 对外提供模型偏好 provider 目录测试，覆盖图片 OpenRouter 选项与标签查询
 * [POS]: lib 的模型配置目录回归保护，防止图片 provider 入口退化或标签漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import {
  getProviderLabel,
  getProviderOption,
  MODEL_PROVIDER_OPTIONS,
} from './model-config-catalog'

describe('model-config-catalog', () => {
  it('exposes OpenRouter as an image provider option', () => {
    expect(MODEL_PROVIDER_OPTIONS.image).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerId: 'openrouter',
          providerKind: 'openrouter',
          label: 'OpenRouter',
        }),
      ]),
    )
  })

  it('resolves image provider labels for OpenRouter', () => {
    expect(getProviderOption('image', 'openrouter')).toEqual(
      expect.objectContaining({
        providerId: 'openrouter',
        providerKind: 'openrouter',
        label: 'OpenRouter',
      }),
    )
    expect(getProviderLabel('image', 'openrouter')).toBe('OpenRouter')
  })
})
