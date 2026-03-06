/**
 * [INPUT]: 依赖 next/dynamic 的客户端动态导入，依赖 @/components/canvas/canvas，
 *          依赖 @/hooks/use-workflows 的 useWorkflow 数据获取，
 *          依赖 @/stores/use-flow-store 的 setFlow 注入画布数据，
 *          依赖 @/services/storage/serializer 的反序列化，
 *          依赖 lucide-react 的 Loader2
 * [OUTPUT]: 对外提供画布编辑器页面 (CSR)
 * [POS]: (app)/workspace/[id] 路由，从 D1 加载工作流数据注入 FlowStore
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { use, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { ReactFlowProvider } from '@xyflow/react'
import { useWorkflow } from '@/hooks/use-workflows'
import { useFlowStore } from '@/stores/use-flow-store'
import { deserializeWorkflow } from '@/services/storage/serializer'

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

/* ─── Page ────────────────────────────────────────────── */

export default function EditorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)
  const { data, isLoading } = useWorkflow(id)
  const hasLoaded = useRef(false)

  /* ── 从 API 数据注入 FlowStore ──────────────────────── */
  useEffect(() => {
    if (hasLoaded.current || isLoading) return
    if (!data) return
    hasLoaded.current = true

    const raw = (data as Record<string, unknown>).data as string | undefined
    if (!raw || raw === '{}') return

    try {
      const parsed = JSON.parse(raw)
      const { nodes, edges, viewport } = deserializeWorkflow(parsed)
      useFlowStore.getState().setFlow(nodes, edges, viewport)
    } catch {
      /* 解析失败时从空画布开始 */
    }
  }, [data, isLoading])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <Canvas workflowId={id} />
    </ReactFlowProvider>
  )
}