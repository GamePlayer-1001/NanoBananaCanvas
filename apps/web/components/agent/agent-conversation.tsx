/**
 * [INPUT]: 依赖 @/components/ui/scroll-area，依赖同目录消息组件与确认卡片组件
 * [OUTPUT]: 对外提供 AgentConversation 组件，渲染轻量消息流、过程消息和 prompt 确认结构
 * [POS]: components/agent 的对话承载层，被 AgentPanel 组合使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ScrollArea } from '@/components/ui/scroll-area'
import { AgentMessageItem } from './agent-message-item'
import { AgentProcessMessage } from './agent-process-message'
import { AgentPromptCompareCard } from './agent-prompt-compare-card'

type ConversationItem =
  | {
      id: string
      type: 'message'
      role: 'user' | 'assistant' | 'diagnosis'
      text: string
      timestamp?: string
    }
  | {
      id: string
      type: 'process'
      text: string
      active?: boolean
    }
  | {
      id: string
      type: 'prompt-confirmation'
      payloadId?: string
      originalIntent: string
      visualProposal: string
      executionPrompt: string
      styleOptions?: string[]
      expanded?: boolean
    }

interface AgentConversationProps {
  items: ConversationItem[]
  emptyState?: string
  hero?: React.ReactNode
  onPromptRegenerate?: (payloadId?: string) => void
  onPromptManualEdit?: (payloadId?: string) => void
  onPromptToggleExpand?: (payloadId?: string) => void
  onPromptStyleSelect?: (payloadId: string | undefined, styleLabel: string) => void
}

export function AgentConversation({
  items,
  emptyState = '告诉我你今天想做什么，我会先帮你理清方向。',
  hero,
  onPromptRegenerate,
  onPromptManualEdit,
  onPromptToggleExpand,
  onPromptStyleSelect,
}: AgentConversationProps) {
  if (items.length === 0) {
    return (
      <div className="h-full min-h-0">
        {hero ?? (
          <div className="flex h-full min-h-[280px] items-center justify-center rounded-[28px] border border-dashed border-black/8 bg-slate-50 px-6 text-center">
            <p className="max-w-[22rem] text-sm leading-7 text-slate-500">{emptyState}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-2 pr-2">
        {items.map((item) => {
          if (item.type === 'message') {
            return (
              <AgentMessageItem
                key={item.id}
                role={item.role}
                text={item.text}
                timestamp={item.timestamp}
              />
            )
          }

          if (item.type === 'process') {
            return (
              <AgentProcessMessage
                key={item.id}
                text={item.text}
                active={item.active}
              />
            )
          }

          return (
            <AgentPromptCompareCard
              key={item.id}
              payloadId={item.payloadId}
              originalIntent={item.originalIntent}
              visualProposal={item.visualProposal}
              executionPrompt={item.executionPrompt}
              styleOptions={item.styleOptions}
              expanded={item.expanded}
              onRegenerate={() => onPromptRegenerate?.(item.payloadId)}
              onManualEdit={() => onPromptManualEdit?.(item.payloadId)}
              onToggleExpand={() => onPromptToggleExpand?.(item.payloadId)}
              onStyleSelect={(styleLabel) => onPromptStyleSelect?.(item.payloadId, styleLabel)}
            />
          )
        })}
      </div>
    </ScrollArea>
  )
}
