/**
 * [INPUT]: 依赖 vitest，依赖 ./image-model-capabilities
 * [OUTPUT]: 对外提供图片模型能力真相源测试 (尺寸解析/能力校验/运行时学习)
 * [POS]: lib 的图片能力回归保护，防止平台动态模型与能力护栏未来退化
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import {
  finalizeLearnedImageCapabilities,
  learnImageCapabilitiesFromError,
  prettifyModelName,
  resolveImageGenerationSize,
  validateImageSelection,
} from './image-model-capabilities'

describe('image-model-capabilities', () => {
  it('formats model ids into readable labels', () => {
    expect(prettifyModelName('gemini-2.5-flash-image-preview')).toBe(
      'Gemini 2.5 Flash Image Preview',
    )
  })

  it('resolves display-resolution presets into concrete sizes', () => {
    expect(resolveImageGenerationSize('auto', '16:9')).toBe('1920x1080')
    expect(resolveImageGenerationSize('1k', '16:9')).toBe('1920x1080')
    expect(resolveImageGenerationSize('2k', '16:9')).toBe('2560x1440')
    expect(resolveImageGenerationSize('4k', '16:9')).toBe('3840x2160')
    expect(resolveImageGenerationSize('8k', '16:9')).toBe('7680x4320')
  })

  it('blocks invalid size and aspect ratio combinations with capabilities', () => {
    expect(
      validateImageSelection('8k', '16:9', { maxLongEdge: 3840 }),
    )?.toMatchObject({ code: 'IMAGE_LONG_EDGE_TOO_LARGE' })
    expect(
      validateImageSelection('1k', '16:9', { minPixels: 3_000_000 }),
    )?.toMatchObject({ code: 'IMAGE_PIXEL_BUDGET_TOO_LOW' })
    expect(
      validateImageSelection('2k', '2:3', {
        allowedAspectRatios: ['1:1', '16:9'],
      }),
    )?.toMatchObject({ code: 'IMAGE_ASPECT_RATIO_NOT_ALLOWED' })
  })

  it('learns max long edge and minimum pixel budget from upstream errors', () => {
    const tooLarge = learnImageCapabilitiesFromError(
      "Invalid size '2304x4096'. The longest edge must be less than or equal to 3840.",
    )
    expect(tooLarge).toMatchObject({ maxLongEdge: 3840 })

    const tooSmall = learnImageCapabilitiesFromError(
      "Invalid size '1024x576'. Requested resolution is below the current minimum pixel budget.",
    )
    const finalized = finalizeLearnedImageCapabilities(
      tooSmall ?? {},
      '1k',
      '16:9',
      'Requested resolution is below the current minimum pixel budget.',
    )
    expect(finalized.minPixels).toBe(2_073_601)
  })
})
