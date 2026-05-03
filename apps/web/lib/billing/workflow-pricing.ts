/**
 * [INPUT]: 依赖 @/lib/image-model-capabilities 的图片尺寸类型，依赖 @/lib/platform-models 的平台模型目录类型
 * [OUTPUT]: 对外提供平台工作流积分规则、文本固定扣分、图片模型尺寸定价、模型别名归一与展示文案工具
 * [POS]: lib/billing 的工作流积分真相源，被节点 UI、平台执行扣费与异步任务计费共用，负责把“按次/按尺寸”产品规则落成统一代码口径
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ImageSizeOptionValue } from '@/lib/image-model-capabilities'
import type { PlatformModelCatalogItem } from '@/lib/platform-models'

export type WorkflowImagePriceTier = Exclude<ImageSizeOptionValue, 'auto'>

export interface WorkflowImagePriceRule {
  key: string
  label: string
  aliases: string[]
  prices: Record<WorkflowImagePriceTier, number>
}

export const PLATFORM_TEXT_EXECUTION_CREDITS = 1
export const SIGNIN_TRIAL_CREDITS = 100
export const WORKFLOW_IMAGE_FALLBACK_PRICES: Record<WorkflowImagePriceTier, number> = {
  '1k': 20,
  '2k': 25,
  '4k': 30,
  '8k': 40,
}

const WORKFLOW_IMAGE_PRICE_RULES: WorkflowImagePriceRule[] = [
  {
    key: 'gpt-image-2',
    label: 'GPT Image 2',
    aliases: ['gpt-image-2', 'gpt image 2'],
    prices: { '1k': 20, '2k': 25, '4k': 30, '8k': 40 },
  },
  {
    key: 'gpt-image-2-all',
    label: 'gpt-image-2-all',
    aliases: ['gpt-image-2-all', 'gpt image 2 all'],
    prices: { '1k': 20, '2k': 25, '4k': 30, '8k': 40 },
  },
  {
    key: 'nano-banana-2-pro',
    label: 'Nano Banana 2 pro',
    aliases: [
      'gemini-3.1-flash-image-preview',
      'nano banana 2 pro',
      'nano-banana-2-pro',
    ],
    prices: { '1k': 25, '2k': 30, '4k': 45, '8k': 50 },
  },
  {
    key: 'nano-banana',
    label: 'Nano Banana',
    aliases: ['nano-banana', 'nano banana'],
    prices: { '1k': 20, '2k': 25, '4k': 30, '8k': 40 },
  },
  {
    key: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    aliases: ['nano-banana-pro', 'nano banana pro'],
    prices: { '1k': 20, '2k': 25, '4k': 30, '8k': 40 },
  },
]

const PLATFORM_TEXT_MODEL_CREDITS: Readonly<Record<string, number>> = {
  'comfly:gpt-5.4': 1,
  'comfly:gemini-3.1-pro-preview': 3,
  'comfly:gemini-2.5-flash': 1,
  'comfly:deepseek-v3': 1,
}

function normalizeAlias(value: string): string {
  return value.toLowerCase().replace(/[_/]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function matchImagePriceRule(modelId: string, modelName?: string | null): WorkflowImagePriceRule | null {
  const haystacks = [modelId, modelName ?? '']
    .map((value) => normalizeAlias(value))
    .filter(Boolean)

  for (const rule of WORKFLOW_IMAGE_PRICE_RULES) {
    const aliases = rule.aliases.map(normalizeAlias)
    if (haystacks.some((haystack) => aliases.some((alias) => haystack.includes(alias)))) {
      return rule
    }
  }

  return null
}

export function getWorkflowImagePriceRule(input: {
  modelId: string
  modelName?: string | null
}): WorkflowImagePriceRule | null {
  return matchImagePriceRule(input.modelId, input.modelName)
}

export function getWorkflowImagePriceForSize(input: {
  modelId: string
  modelName?: string | null
  size: ImageSizeOptionValue
}): number | null {
  const rule = matchImagePriceRule(input.modelId, input.modelName)
  if (input.size === 'auto') {
    return null
  }

  if (!rule) {
    return WORKFLOW_IMAGE_FALLBACK_PRICES[input.size]
  }

  return rule.prices[input.size]
}

export function describeWorkflowImagePrice(input: {
  modelId: string
  modelName?: string | null
  size: ImageSizeOptionValue
}): {
  label: string
  credits: number | null
  isAuto: boolean
  isFallback: boolean
} | null {
  const rule = matchImagePriceRule(input.modelId, input.modelName)
  const fallbackLabel = input.modelName?.trim() || input.modelId

  if (input.size === 'auto') {
    return {
      label: `${rule?.label ?? fallbackLabel} · Auto`,
      credits: null,
      isAuto: true,
      isFallback: !rule,
    }
  }

  if (!rule) {
    return {
      label: `${fallbackLabel} · ${input.size.toUpperCase()}`,
      credits: WORKFLOW_IMAGE_FALLBACK_PRICES[input.size],
      isAuto: false,
      isFallback: true,
    }
  }

  return {
    label: `${rule.label} · ${input.size.toUpperCase()}`,
    credits: rule.prices[input.size],
    isAuto: false,
    isFallback: false,
  }
}

export function getWorkflowImageModelBadge(model: Pick<PlatformModelCatalogItem, 'modelId' | 'modelName'> | null | undefined) {
  if (!model) {
    return null
  }

  const rule = matchImagePriceRule(model.modelId, model.modelName)
  if (!rule) {
    return null
  }

  return rule.label
}

export function getPlatformTextExecutionCredits(input: {
  provider: string
  modelId: string
}): number {
  return (
    PLATFORM_TEXT_MODEL_CREDITS[`${input.provider}:${input.modelId}`] ??
    PLATFORM_TEXT_EXECUTION_CREDITS
  )
}
