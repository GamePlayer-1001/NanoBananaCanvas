/**
 * [INPUT]: 依赖 react 的 useMemo/useState，依赖 @/components/ui/scroll-area，依赖同目录消息组件与轻量 prompt 展示组件
 * [OUTPUT]: 对外提供 AgentConversation 组件，渲染轻量消息流、自动折叠的过程记录与纯文本 prompt 确认结构
 * [POS]: components/agent 的对话承载层，被 AgentPanel 组合使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
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

type ProcessConversationItem = Extract<ConversationItem, { type: 'process' }>
type PromptConversationItem = Extract<ConversationItem, { type: 'prompt-confirmation' }>
type DisplayItem =
  | ConversationItem
  | {
      id: string
      type: 'process-group'
      items: ProcessConversationItem[]
      active?: boolean
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
  const [expandedProcessGroupIds, setExpandedProcessGroupIds] = useState<string[]>([])

  const displayItems = useMemo<DisplayItem[]>(() => {
    const nextItems: DisplayItem[] = []

    for (const item of items) {
      if (item.type !== 'process') {
        nextItems.push(item)
        continue
      }

      const previous = nextItems.at(-1)
      if (previous?.type === 'process-group') {
        previous.items.push(item)
        previous.active = previous.active || item.active
        continue
      }

      nextItems.push({
        id: item.id,
        type: 'process-group',
        items: [item],
        active: item.active,
      })
    }

    return nextItems
  }, [items])

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
        {displayItems.map((item) => {
          if (item.type === 'process-group') {
            const expanded = expandedProcessGroupIds.includes(item.id)
            const latestText = item.items.at(-1)?.text ?? ''
            const summaryText =
              item.items.length > 1 ? `${latestText} · 共 ${item.items.length} 个过程` : latestText

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[20px] border border-black/6 bg-white/82 shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 motion-reduce:transition-none"
                  onClick={() =>
                    setExpandedProcessGroupIds((current) =>
                      current.includes(item.id)
                        ? current.filter((value) => value !== item.id)
                        : [...current, item.id],
                    )
                  }
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium tracking-[0.08em] text-slate-400 uppercase">
                      处理过程
                    </p>
                    <p className="mt-1 truncate text-[13px] leading-6 text-slate-700">
                      {summaryText}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'shrink-0 text-slate-400 transition-transform motion-reduce:transition-none',
                      expanded && 'rotate-180',
                    )}
                  />
                </button>

                {expanded ? (
                  <div className="space-y-2 border-t border-black/6 px-3 py-3">
                    {item.items.map((processItem) => (
                      <AgentProcessMessage
                        key={processItem.id}
                        text={processItem.text}
                        active={processItem.active}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )
          }

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

      const promptItem = item as PromptConversationItem
      return (
        <AgentPromptCompareCard
          key={promptItem.id}
          payloadId={promptItem.payloadId}
          originalIntent={promptItem.originalIntent}
          visualProposal={promptItem.visualProposal}
          executionPrompt={promptItem.executionPrompt}
          styleOptions={promptItem.styleOptions}
          expanded={promptItem.expanded}
          onRegenerate={() => onPromptRegenerate?.(promptItem.payloadId)}
          onManualEdit={() => onPromptManualEdit?.(promptItem.payloadId)}
          onToggleExpand={() => onPromptToggleExpand?.(promptItem.payloadId)}
          onStyleSelect={(styleLabel) => onPromptStyleSelect?.(promptItem.payloadId, styleLabel)}
        />
      )
    })}
      </div>
    </ScrollArea>
  )
}
