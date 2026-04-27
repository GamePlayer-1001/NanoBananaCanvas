/**
 * [INPUT]: 依赖 vitest，依赖 ./filter-node-entry-groups 与节点入口配置
 * [OUTPUT]: filterNodeEntryGroupsByPort 单元测试
 * [POS]: lib/utils 的菜单筛选测试，覆盖按端口方向与类型过滤拖线建节点候选
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { CANVAS_CONTEXT_MENU_GROUPS } from '@/components/canvas/node-entry-config'

import { filterNodeEntryGroupsByPort } from './filter-node-entry-groups'

describe('filterNodeEntryGroupsByPort', () => {
  it('keeps only string-input candidates when dragging from a string output', () => {
    const groups = filterNodeEntryGroupsByPort(CANVAS_CONTEXT_MENU_GROUPS, {
      nodeType: 'text-input',
      handleId: 'text-out',
      handleType: 'source',
    })

    expect(groups.flatMap((group) => group.items.map((item) => item.type))).toEqual([
      'llm',
      'text-merge',
      'image-gen',
      'video-gen',
      'audio-gen',
    ])
  })

  it('keeps only image-output candidates when dragging backwards from an image input', () => {
    const groups = filterNodeEntryGroupsByPort(CANVAS_CONTEXT_MENU_GROUPS, {
      nodeType: 'image-gen',
      handleId: 'image-in',
      handleType: 'target',
    })

    expect(groups.flatMap((group) => group.items.map((item) => item.type))).toEqual([
      'image-input',
      'image-gen',
    ])
  })
})
