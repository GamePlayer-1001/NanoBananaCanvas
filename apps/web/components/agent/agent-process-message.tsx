/**
 * [INPUT]: 依赖 lucide-react 的 Loader2，依赖 @/lib/utils 的 cn
 * [OUTPUT]: 对外提供 AgentProcessMessage 组件，渲染轻量过程反馈与 reduced motion 兼容状态条
 * [POS]: components/agent 的过程消息组件，被 AgentConversation 复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentProcessMessageProps {
  text: string
  active?: boolean
}

export function AgentProcessMessage({
  text,
  active = false,
}: AgentProcessMessageProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/85 px-3 py-2.5 text-xs text-slate-600 shadow-sm">
      <div className="flex items-center gap-2">
        <Loader2
          size={13}
          className={cn(
            active
              ? 'text-indigo-600 motion-safe:animate-spin motion-reduce:animate-none'
              : 'text-slate-400',
          )}
        />
        <span className="leading-5">{text}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className={cn(
            'h-full rounded-full bg-indigo-500/75 transition-all duration-500 motion-reduce:transition-none',
            active
              ? 'w-2/3 motion-safe:animate-pulse'
              : 'w-1/3 opacity-60',
          )}
        />
      </div>
    </div>
  )
}
