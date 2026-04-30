/**
 * [INPUT]: 依赖 react 的 ReactNode，依赖宿主布局传入的 Header / Conversation / Quick Actions / Composer 槽位
 * [OUTPUT]: 对外提供 AgentPanel 组件，作为右侧 Agent 面板总装配壳
 * [POS]: components/agent 的顶层容器，被编辑器页接入，用于承载 Agent 各分区但不持有业务编排逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ReactNode } from 'react'

interface AgentPanelProps {
  header?: ReactNode
  conversation?: ReactNode
  quickActions?: ReactNode
  composer?: ReactNode
}

export function AgentPanel({
  header,
  conversation,
  quickActions,
  composer,
}: AgentPanelProps) {
  return (
    <aside className="border-border/80 bg-background/96 flex h-full min-h-0 w-full flex-col border-l backdrop-blur-sm">
      <div className="border-border/80 shrink-0 border-b px-4 py-3">
        {header ?? (
          <div className="space-y-1">
            <p className="text-foreground text-sm font-semibold">Agent</p>
            <p className="text-muted-foreground text-xs">正在准备面板骨架...</p>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {conversation ?? (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-black/10 bg-black/[0.02] text-center">
            <p className="text-muted-foreground text-sm">对话区占位</p>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-3">
        {quickActions ?? null}
      </div>

      <div className="border-border/80 shrink-0 border-t px-4 py-3">
        {composer ?? (
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-3 py-4">
            <p className="text-muted-foreground text-sm">输入区占位</p>
          </div>
        )}
      </div>
    </aside>
  )
}
