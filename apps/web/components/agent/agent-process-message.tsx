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
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/75 px-3.5 py-3 text-[12px] text-slate-600 shadow-sm">
      <div className="flex items-center gap-2.5">
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
    </div>
  )
}
