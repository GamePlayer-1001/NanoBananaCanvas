/**
 * [INPUT]: 依赖 vitest，依赖 ./platform-models 的平台图片逻辑目录与归一化工具
 * [OUTPUT]: 对外提供平台图片逻辑模型测试，覆盖 dlapi 主链与 comfly fallback 回显归一
 * [POS]: lib 的平台模型回归保护，防止前端把供应商内部 fallback 模型泄漏为用户可选展示
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import {
  findLogicalPlatformImageModel,
  getVisibleLogicalPlatformImageModels,
  LOGICAL_PLATFORM_IMAGE_MODELS,
} from './platform-models'

describe('platform logical image models', () => {
  it('exposes only four business-facing platform image models', () => {
    expect(LOGICAL_PLATFORM_IMAGE_MODELS).toHaveLength(4)
    expect(LOGICAL_PLATFORM_IMAGE_MODELS.map((item) => item.modelName)).toEqual([
      'GPT Image 2',
      'Nano Banana 2 Pro',
      'Nano Banana Pro',
      'Nano Banana',
    ])
  })

  it('keeps Nano Banana variants in the logical catalog but hides them from the image node dropdown', () => {
    expect(getVisibleLogicalPlatformImageModels().map((item) => item.modelName)).toEqual([
      'GPT Image 2',
    ])
  })

  it('maps comfly fallback model back to GPT Image 2 logical model', () => {
    expect(
      findLogicalPlatformImageModel({
        provider: 'comfly',
        modelId: 'gpt-image-2-all',
      }),
    ).toMatchObject({
      logicalKey: 'gpt-image-2',
      provider: 'dlapi',
      modelId: 'gpt-image-2',
      modelName: 'GPT Image 2',
    })
  })

  it('maps old saved fallback ids without provider back to the logical model', () => {
    expect(
      findLogicalPlatformImageModel({
        modelId: 'nano-banana-pro',
      }),
    ).toMatchObject({
      logicalKey: 'nano-banana-pro',
      provider: 'dlapi',
      modelId: 'gemini-3-pro-image-preview',
      modelName: 'Nano Banana Pro',
    })
  })
})
