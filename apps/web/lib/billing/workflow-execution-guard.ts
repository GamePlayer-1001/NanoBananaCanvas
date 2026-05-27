/**
 * [INPUT]: 依赖 @/types 的 WorkflowNode，依赖 @/lib/ai-node-config 的执行目标解析，
 *          依赖 ./workflow-pricing 的平台文本/图片积分规则
 * [OUTPUT]: 对外提供工作流运行前的文本长度校验与平台积分预估能力
 * [POS]: lib/billing 的运行前护栏层，被画布运行入口复用，负责把“是否值得开跑”收口成统一判断
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { WorkflowNode } from '@/types'
import { resolveNodeExecutionTarget } from '@/lib/ai-node-config'
import {
  getWorkflowImagePriceForSize,
  getPlatformTextExecutionCredits,
  WORKFLOW_IMAGE_FALLBACK_PRICES,
} from './workflow-pricing'

export const TEXT_INPUT_MAX_LENGTH = 800

export interface WorkflowTextLengthViolation {
  nodeId: string
  label: string
  actualLength: number
  maxLength: number
}

export interface WorkflowExecutionEstimate {
  estimatedCredits: number
  billableNodeCount: number
  hasAutoPricedNode: boolean
  textLengthViolations: WorkflowTextLengthViolation[]
}

function readConfigString(config: Record<string, unknown>, key: string): string | null {
  const value = config[key]
  return typeof value === 'string' ? value : null
}

function estimateImageNodeCredits(node: WorkflowNode): {
  credits: number
  auto: boolean
} {
  const config = node.data.config
  const target = resolveNodeExecutionTarget('image-gen', config)
  const size = typeof config.size === 'string' ? config.size : 'auto'

  const explicitCredits = getWorkflowImagePriceForSize({
    modelId: target.platformModel,
    size: size as 'auto' | '1k' | '2k' | '4k' | '8k',
  })

  if (explicitCredits != null) {
    return { credits: explicitCredits, auto: false }
  }

  // `auto` 在后端会按真实尺寸结算。运行前预检必须保守，避免低估导致任务跑到一半才失败。
  return { credits: WORKFLOW_IMAGE_FALLBACK_PRICES['1k'], auto: true }
}

function estimateTextNodeCredits(node: WorkflowNode): number {
  const target = resolveNodeExecutionTarget('llm', node.data.config)
  return getPlatformTextExecutionCredits({
    provider: target.platformProvider,
    modelId: target.platformModel,
  })
}

function collectTextLengthViolation(node: WorkflowNode): WorkflowTextLengthViolation | null {
  if (node.type !== 'input' && node.type !== 'text-input') {
    return null
  }

  const text = readConfigString(node.data.config, 'text') ?? ''
  const actualLength = text.trim().length
  if (actualLength <= TEXT_INPUT_MAX_LENGTH) {
    return null
  }

  return {
    nodeId: node.id,
    label: typeof node.data.label === 'string' ? node.data.label : 'Text Input',
    actualLength,
    maxLength: TEXT_INPUT_MAX_LENGTH,
  }
}

export function estimateWorkflowExecution(nodes: WorkflowNode[]): WorkflowExecutionEstimate {
  let estimatedCredits = 0
  let billableNodeCount = 0
  let hasAutoPricedNode = false
  const textLengthViolations: WorkflowTextLengthViolation[] = []

  for (const node of nodes) {
    const violation = collectTextLengthViolation(node)
    if (violation) {
      textLengthViolations.push(violation)
    }

    if (node.type === 'llm') {
      estimatedCredits += estimateTextNodeCredits(node)
      billableNodeCount += 1
      continue
    }

    if (node.type === 'image-gen') {
      const imageEstimate = estimateImageNodeCredits(node)
      estimatedCredits += imageEstimate.credits
      billableNodeCount += 1
      hasAutoPricedNode ||= imageEstimate.auto
    }
  }

  return {
    estimatedCredits,
    billableNodeCount,
    hasAutoPricedNode,
    textLengthViolations,
  }
}
