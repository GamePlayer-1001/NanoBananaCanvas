/**
 * [INPUT]: 依赖 @/components/ui/scroll-area，依赖同目录消息组件与提案卡片组件
 * [OUTPUT]: 对外提供 AgentConversation 组件，渲染消息流、过程消息和提案卡片
 * [POS]: components/agent 的对话承载层，被 AgentPanel 组合使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ScrollArea } from '@/components/ui/scroll-area'
import { AgentMessageItem } from './agent-message-item'
import { AgentProcessMessage } from './agent-process-message'
import { AgentProposalCard } from './agent-proposal-card'
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
      type: 'proposal'
      title: string
      summary: string
      reasons?: string[]
      requiresConfirmation?: boolean
      changes?: Array<{
        label: string
        detail: string
        risk?: 'low' | 'medium' | 'high'
      }>
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
  onPromptConfirm?: (payloadId?: string) => void
  onPromptRegenerate?: (payloadId?: string) => void
  onPromptManualEdit?: (payloadId?: string) => void
  onPromptToggleExpand?: (payloadId?: string) => void
  onPromptStyleSelect?: (payloadId: string | undefined, styleLabel: string) => void
}

export function AgentConversation({
  items,
  emptyState = '告诉我你想搭建什么工作流，我会先给出一个提案。',
  onPromptConfirm,
  onPromptRegenerate,
  onPromptManualEdit,
  onPromptToggleExpand,
  onPromptStyleSelect,
}: AgentConversationProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pr-3">
        {items.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-5 text-center">
            <p className="text-muted-foreground text-sm leading-6">{emptyState}</p>
          </div>
        ) : null}
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

          if (item.type === 'proposal') {
            return (
              <AgentProposalCard
                key={item.id}
                title={item.title}
                summary={item.summary}
                reasons={item.reasons}
                changes={item.changes}
                requiresConfirmation={item.requiresConfirmation}
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
              onConfirm={() => onPromptConfirm?.(item.payloadId)}
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
