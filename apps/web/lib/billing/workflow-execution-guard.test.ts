/**
 * [INPUT]: 依赖 vitest，依赖 ./workflow-execution-guard，依赖 @/lib/utils/create-node
 * [OUTPUT]: 对外提供工作流运行前护栏测试，覆盖文本上限与平台积分预估
 * [POS]: lib/billing 的运行前护栏回归测试，防止预估口径与输入限制漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { createNode } from '@/lib/utils/create-node'

import {
  estimateWorkflowExecution,
  TEXT_INPUT_MAX_LENGTH,
} from './workflow-execution-guard'

describe('workflow execution guard', () => {
  it('counts platform llm and image nodes into a single workflow estimate', () => {
    const textNode = createNode('text-input', { x: 0, y: 0 })
    const llmNode = createNode('llm', { x: 100, y: 0 })
    const imageNode = createNode('image-gen', { x: 200, y: 0 })
    imageNode.data.config = {
      ...imageNode.data.config,
      size: '1k',
      platformProvider: 'dlapi',
      platformModel: 'gpt-image-2',
    }

    const estimate = estimateWorkflowExecution([textNode, llmNode, imageNode])

    expect(estimate.estimatedCredits).toBe(21)
    expect(estimate.billableNodeCount).toBe(2)
    expect(estimate.hasAutoPricedNode).toBe(false)
    expect(estimate.textLengthViolations).toEqual([])
  })

  it('treats auto-sized image nodes as conservatively billable', () => {
    const imageNode = createNode('image-gen', { x: 0, y: 0 })
    imageNode.data.config = {
      ...imageNode.data.config,
      size: 'auto',
      platformProvider: 'dlapi',
      platformModel: 'gpt-image-2',
    }

    const estimate = estimateWorkflowExecution([imageNode])

    expect(estimate.estimatedCredits).toBe(20)
    expect(estimate.hasAutoPricedNode).toBe(true)
  })

  it('flags text input nodes longer than the max length', () => {
    const textNode = createNode('text-input', { x: 0, y: 0 })
    textNode.data.config = {
      ...textNode.data.config,
      text: 'a'.repeat(TEXT_INPUT_MAX_LENGTH + 1),
    }

    const estimate = estimateWorkflowExecution([textNode])

    expect(estimate.textLengthViolations).toEqual([
      {
        nodeId: textNode.id,
        label: 'Text Input',
        actualLength: TEXT_INPUT_MAX_LENGTH + 1,
        maxLength: TEXT_INPUT_MAX_LENGTH,
      },
    ])
  })
})
