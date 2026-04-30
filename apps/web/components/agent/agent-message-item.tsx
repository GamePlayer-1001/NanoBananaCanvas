/**
 * [INPUT]: 依赖 @/lib/utils 的 cn，依赖消息角色与时间文本
 * [OUTPUT]: 对外提供 AgentMessageItem 组件，渲染用户/助手/诊断等通用消息气泡
 * [POS]: components/agent 的基础消息渲染器，被 AgentConversation 复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { cn } from '@/lib/utils'

type AgentMessageTone = 'user' | 'assistant' | 'diagnosis'

interface AgentMessageItemProps {
  role: AgentMessageTone
  text: string
  timestamp?: string
}

const ROLE_STYLES: Record<AgentMessageTone, string> = {
  user: 'ml-auto bg-indigo-500 text-white',
  assistant: 'mr-auto border border-black/8 bg-white text-slate-900',
  diagnosis: 'mr-auto border border-amber-200 bg-amber-50 text-amber-950',
}

export function AgentMessageItem({
  role,
  text,
  timestamp,
}: AgentMessageItemProps) {
  return (
    <div
      className={cn(
        'max-w-[88%] rounded-2xl px-3.5 py-3 shadow-sm',
        ROLE_STYLES[role],
      )}
    >
      <p className="whitespace-pre-wrap text-sm leading-6">{text}</p>
      {timestamp ? (
        <p
          className={cn(
            'mt-2 text-[11px]',
            role === 'user' ? 'text-white/72' : 'text-slate-500',
          )}
        >
          {timestamp}
        </p>
      ) : null}
    </div>
  )
}
