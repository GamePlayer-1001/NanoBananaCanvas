/**
 * [INPUT]: 依赖 @/lib/utils 的 cn，依赖消息角色与时间文本
 * [OUTPUT]: 对外提供 AgentMessageItem 组件，渲染更轻量的用户/助手/诊断消息气泡
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
  user: 'ml-auto bg-slate-900 text-white',
  assistant: 'mr-auto border border-black/6 bg-white text-slate-900',
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
        'max-w-[92%] rounded-[22px] px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)]',
        ROLE_STYLES[role],
      )}
    >
      <p className="whitespace-pre-wrap text-[13px] leading-6">{text}</p>
      {timestamp ? (
        <p
          className={cn(
            'mt-2 text-[10px]',
            role === 'user' ? 'text-white/65' : 'text-slate-400',
          )}
        >
          {timestamp}
        </p>
      ) : null}
    </div>
  )
}
