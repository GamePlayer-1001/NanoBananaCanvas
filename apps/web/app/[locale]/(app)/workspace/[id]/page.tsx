/**
 * [INPUT]: 依赖 next/dynamic 的客户端动态导入，依赖 @/components/canvas/canvas，
 *          依赖 lucide-react 的 Loader2
 * [OUTPUT]: 对外提供画布编辑器页面 (CSR)
 * [POS]: (app)/workspace/[id] 路由，ReactFlow 纯客户端渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { ReactFlowProvider } from '@xyflow/react'

const Canvas = dynamic(
  () => import('@/components/canvas/canvas').then((m) => ({ default: m.Canvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    ),
  },
)

export default function EditorPage() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}
