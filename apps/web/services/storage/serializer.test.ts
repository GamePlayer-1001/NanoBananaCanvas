/**
 * [INPUT]: 依赖 vitest，依赖 ./serializer 的序列化能力，依赖 @/types 的 WorkflowNodeData 结构
 * [OUTPUT]: 对外提供 serializer 回归测试，验证运行态字段不会进入持久化快照，而最终产物字段会被保留
 * [POS]: services/storage 的回归保护，防止异步任务运行态再次污染工作流持久化
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'
import type { Node } from '@xyflow/react'
import type { WorkflowNodeData } from '@/types/workflow'
import { serializeWorkflow } from './serializer'

function buildImageNode(config: Record<string, unknown>): Node<WorkflowNodeData> {
  return {
    id: 'node-image-1',
    type: 'image-gen',
    position: { x: 120, y: 80 },
    data: {
      label: 'Image',
      type: 'media',
      status: 'running',
      config,
    },
  }
}

describe('serializeWorkflow', () => {
  it('strips transient task runtime fields from node config', () => {
    const serialized = serializeWorkflow(
      [
        buildImageNode({
          prompt: 'draw a cat',
          taskId: 'task-123',
          progress: 62,
        }),
      ],
      [],
      { x: 0, y: 0, zoom: 1 },
    )

    expect(serialized.nodes[0]?.data.status).toBe('idle')
    expect(serialized.nodes[0]?.data.config).toEqual({
      prompt: 'draw a cat',
    })
  })

  it('preserves final result fields needed by saved workflows', () => {
    const serialized = serializeWorkflow(
      [
        buildImageNode({
          prompt: 'draw a poster',
          resultUrl: '/api/files/outputs/user-1/task-1.png',
        }),
      ],
      [],
      { x: 0, y: 0, zoom: 1 },
    )

    expect(serialized.nodes[0]?.data.config).toEqual({
      prompt: 'draw a poster',
      resultUrl: '/api/files/outputs/user-1/task-1.png',
    })
  })
})
