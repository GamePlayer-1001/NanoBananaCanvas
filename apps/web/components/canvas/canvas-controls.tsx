/**
 * [INPUT]: 依赖 @xyflow/react 的 Controls/useReactFlow
 * [OUTPUT]: 对外提供 CanvasControls 缩放/居中控制栏
 * [POS]: components/canvas 的辅助控件，被 Canvas 内嵌使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { Controls } from '@xyflow/react'

export function CanvasControls() {
  return (
    <Controls
      showInteractive={false}
      position="bottom-right"
      className="border-border bg-card rounded-lg border shadow-sm"
    />
  )
}
