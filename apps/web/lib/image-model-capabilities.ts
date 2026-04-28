/**
 * [INPUT]: 依赖无外部模块
 * [OUTPUT]: 对外提供图片尺寸预设、模型名润色、静态能力表、能力合并、前后端校验与运行时错误学习解析
 * [POS]: lib 的图片模型能力真相源，被图片节点 UI、用户配置页与后端图片任务处理器共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const IMAGE_SIZE_PRESET_LONG_EDGE: Record<ImageSizePreset, number> = {
  '720p': 1280,
  '1k': 1920,
  '2k': 2560,
  '4k': 3840,
  '8k': 7680,
}

export const IMAGE_ASPECT_RATIO_MAP: Record<ImageAspectRatio, [number, number]> = {
  '1:1': [1, 1],
  '2:3': [2, 3],
  '3:2': [3, 2],
  '9:16': [9, 16],
  '16:9': [16, 9],
}

export const IMAGE_SIZE_OPTIONS = [
  { value: '720p', label: '720P' },
  { value: '1k', label: '1K' },
  { value: '2k', label: '2K' },
  { value: '4k', label: '4K' },
  { value: '8k', label: '8K' },
] as const

export const IMAGE_ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: '1:1' },
  { value: '2:3', label: '2:3' },
  { value: '3:2', label: '3:2' },
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
] as const

export type ImageSizePreset = keyof typeof IMAGE_SIZE_PRESET_LONG_EDGE
export type ImageAspectRatio = keyof typeof IMAGE_ASPECT_RATIO_MAP

export interface ImageModelCapabilities {
  minPixels?: number
  maxPixels?: number
  maxLongEdge?: number
  allowedSizes?: ImageSizePreset[]
  allowedAspectRatios?: ImageAspectRatio[]
  learnedFrom?: string
  learnedAt?: string
}

export interface ResolvedImageSize {
  width: number
  height: number
  pixels: number
  longEdge: number
  size: string
}

export interface ImageConstraintViolation {
  code:
    | 'IMAGE_SIZE_NOT_ALLOWED'
    | 'IMAGE_ASPECT_RATIO_NOT_ALLOWED'
    | 'IMAGE_LONG_EDGE_TOO_LARGE'
    | 'IMAGE_PIXEL_BUDGET_TOO_LOW'
    | 'IMAGE_PIXEL_BUDGET_TOO_HIGH'
  message: string
}

const STATIC_IMAGE_MODEL_CAPABILITIES: Record<string, ImageModelCapabilities> = {
  // 平台已知模型从这里逐步补齐。当前先保留表结构，后续可以按 provider/model 增量扩展。
  'openrouter:openai/dall-e-3': {},
  'gemini:imagen-3.0-generate-002': {},
}

function roundToEven(value: number): number {
  const rounded = Math.max(2, Math.round(value))
  return rounded % 2 === 0 ? rounded : rounded + 1
}

export function isImageSizePreset(value: string): value is ImageSizePreset {
  return value in IMAGE_SIZE_PRESET_LONG_EDGE
}

export function isImageAspectRatio(value: string): value is ImageAspectRatio {
  return value in IMAGE_ASPECT_RATIO_MAP
}

export function resolveImageGenerationSize(
  sizePreset: string,
  aspectRatio: string,
): string {
  return formatResolvedImageSize(resolveImageSize(sizePreset, aspectRatio))
}

export function resolveImageSize(
  sizePreset: string,
  aspectRatio: string,
): ResolvedImageSize {
  if (/^\d+x\d+$/i.test(sizePreset)) {
    const [widthText, heightText] = sizePreset.toLowerCase().split('x')
    const width = Number(widthText)
    const height = Number(heightText)

    return {
      width,
      height,
      pixels: width * height,
      longEdge: Math.max(width, height),
      size: `${width}x${height}`,
    }
  }

  const longEdge =
    IMAGE_SIZE_PRESET_LONG_EDGE[isImageSizePreset(sizePreset) ? sizePreset : '1k']
  const ratio =
    IMAGE_ASPECT_RATIO_MAP[isImageAspectRatio(aspectRatio) ? aspectRatio : '1:1']
  const [rawWidthRatio, rawHeightRatio] = ratio

  if (rawWidthRatio === rawHeightRatio) {
    return {
      width: longEdge,
      height: longEdge,
      pixels: longEdge * longEdge,
      longEdge,
      size: `${longEdge}x${longEdge}`,
    }
  }

  const isLandscape = rawWidthRatio > rawHeightRatio
  const widthRatio = isLandscape ? rawWidthRatio : rawHeightRatio
  const heightRatio = isLandscape ? rawHeightRatio : rawWidthRatio
  const shortEdge = roundToEven((longEdge * heightRatio) / widthRatio)
  const width = isLandscape ? longEdge : shortEdge
  const height = isLandscape ? shortEdge : longEdge

  return {
    width,
    height,
    pixels: width * height,
    longEdge: Math.max(width, height),
    size: `${width}x${height}`,
  }
}

export function formatResolvedImageSize(input: ResolvedImageSize): string {
  return `${input.width}x${input.height}`
}

export function prettifyModelName(modelId: string): string {
  return modelId
    .replace(/[/_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
}

export function getStaticImageModelCapabilities(
  provider: string,
  modelId: string,
): ImageModelCapabilities | undefined {
  return STATIC_IMAGE_MODEL_CAPABILITIES[`${provider}:${modelId}`]
}

export function mergeImageModelCapabilities(
  ...capabilities: Array<ImageModelCapabilities | undefined>
): ImageModelCapabilities | undefined {
  const defined = capabilities.filter(Boolean)
  if (!defined.length) {
    return undefined
  }

  return defined.reduce<ImageModelCapabilities>((merged, current) => {
    const next = current as ImageModelCapabilities

    if (typeof next.minPixels === 'number') {
      merged.minPixels = Math.max(merged.minPixels ?? 0, next.minPixels)
    }

    if (typeof next.maxPixels === 'number') {
      merged.maxPixels =
        typeof merged.maxPixels === 'number'
          ? Math.min(merged.maxPixels, next.maxPixels)
          : next.maxPixels
    }

    if (typeof next.maxLongEdge === 'number') {
      merged.maxLongEdge =
        typeof merged.maxLongEdge === 'number'
          ? Math.min(merged.maxLongEdge, next.maxLongEdge)
          : next.maxLongEdge
    }

    if (next.allowedSizes?.length) {
      merged.allowedSizes = intersectOrAdopt(merged.allowedSizes, next.allowedSizes)
    }

    if (next.allowedAspectRatios?.length) {
      merged.allowedAspectRatios = intersectOrAdopt(
        merged.allowedAspectRatios,
        next.allowedAspectRatios,
      )
    }

    if (next.learnedFrom) {
      merged.learnedFrom = next.learnedFrom
    }

    if (next.learnedAt) {
      merged.learnedAt = next.learnedAt
    }

    return merged
  }, {})
}

function intersectOrAdopt<T extends string>(
  current: T[] | undefined,
  next: T[],
): T[] {
  if (!current?.length) {
    return [...next]
  }

  return current.filter((item) => next.includes(item))
}

export function validateImageSelection(
  sizePreset: string,
  aspectRatio: string,
  capabilities?: ImageModelCapabilities,
): ImageConstraintViolation | null {
  if (!capabilities) {
    return null
  }

  const resolved = resolveImageSize(sizePreset, aspectRatio)

  if (
    capabilities.allowedSizes?.length &&
    isImageSizePreset(sizePreset) &&
    !capabilities.allowedSizes.includes(sizePreset)
  ) {
    return {
      code: 'IMAGE_SIZE_NOT_ALLOWED',
      message: `Preset ${sizePreset} is not allowed for this model`,
    }
  }

  if (
    capabilities.allowedAspectRatios?.length &&
    isImageAspectRatio(aspectRatio) &&
    !capabilities.allowedAspectRatios.includes(aspectRatio)
  ) {
    return {
      code: 'IMAGE_ASPECT_RATIO_NOT_ALLOWED',
      message: `Aspect ratio ${aspectRatio} is not allowed for this model`,
    }
  }

  if (
    typeof capabilities.maxLongEdge === 'number' &&
    resolved.longEdge > capabilities.maxLongEdge
  ) {
    return {
      code: 'IMAGE_LONG_EDGE_TOO_LARGE',
      message: `Longest edge ${resolved.longEdge} exceeds limit ${capabilities.maxLongEdge}`,
    }
  }

  if (
    typeof capabilities.minPixels === 'number' &&
    resolved.pixels < capabilities.minPixels
  ) {
    return {
      code: 'IMAGE_PIXEL_BUDGET_TOO_LOW',
      message: `Pixel budget ${resolved.pixels} is below minimum ${capabilities.minPixels}`,
    }
  }

  if (
    typeof capabilities.maxPixels === 'number' &&
    resolved.pixels > capabilities.maxPixels
  ) {
    return {
      code: 'IMAGE_PIXEL_BUDGET_TOO_HIGH',
      message: `Pixel budget ${resolved.pixels} exceeds maximum ${capabilities.maxPixels}`,
    }
  }

  return null
}

export function learnImageCapabilitiesFromError(
  errorMessage: string,
): ImageModelCapabilities | null {
  const maxLongEdgeMatch =
    /longest edge must be less than or equal to\s+(\d+)/i.exec(errorMessage)
  const learned: ImageModelCapabilities = {}

  if (maxLongEdgeMatch) {
    learned.maxLongEdge = Number(maxLongEdgeMatch[1])
  }

  if (/below the current minimum pixel budget/i.test(errorMessage)) {
    learned.minPixels = 1
  }

  if (/aspect ratio/i.test(errorMessage) && /not supported|unsupported|invalid/i.test(errorMessage)) {
    // 当前无法从报错中可靠推断允许列表，保留钩子以便未来扩展。
  }

  if (!Object.keys(learned).length) {
    return null
  }

  return learned
}

export function finalizeLearnedImageCapabilities(
  learned: ImageModelCapabilities,
  sizePreset: string,
  aspectRatio: string,
  errorMessage: string,
): ImageModelCapabilities {
  const resolved = resolveImageSize(sizePreset, aspectRatio)
  const finalized: ImageModelCapabilities = {
    ...learned,
    learnedFrom: errorMessage,
    learnedAt: new Date().toISOString(),
  }

  if (learned.minPixels) {
    finalized.minPixels = resolved.pixels + 1
  }

  return finalized
}

