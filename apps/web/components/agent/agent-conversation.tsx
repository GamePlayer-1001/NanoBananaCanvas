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
      originalIntent: string
      visualProposal: string
      executionPrompt: string
    }

interface AgentConversationProps {
  items: ConversationItem[]
}

export function AgentConversation({ items }: AgentConversationProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pr-3">
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
                changes={item.changes}
                requiresConfirmation={item.requiresConfirmation}
              />
            )
          }

          return (
            <AgentPromptCompareCard
              key={item.id}
              originalIntent={item.originalIntent}
              visualProposal={item.visualProposal}
              executionPrompt={item.executionPrompt}
            />
          )
        })}
      </div>
    </ScrollArea>
  )
}
