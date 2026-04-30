/**
 * [INPUT]: 依赖 @/components/ui/card 与 @/components/ui/badge，依赖提案摘要与风险级别文案
 * [OUTPUT]: 对外提供 AgentProposalCard 组件，展示结构化提案摘要
 * [POS]: components/agent 的提案卡片，被 AgentConversation 复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AgentProposalChange {
  label: string
  detail: string
  risk?: 'low' | 'medium' | 'high'
}

interface AgentProposalCardProps {
  title: string
  summary: string
  changes?: AgentProposalChange[]
  requiresConfirmation?: boolean
}

const RISK_LABEL: Record<NonNullable<AgentProposalChange['risk']>, string> = {
  low: '低风险',
  medium: '需留意',
  high: '建议确认',
}

export function AgentProposalCard({
  title,
  summary,
  changes = [],
  requiresConfirmation = false,
}: AgentProposalCardProps) {
  return (
    <Card className="gap-4 rounded-3xl border-black/8 bg-white/96 py-4 shadow-sm">
      <CardHeader className="gap-3 px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          <Badge variant={requiresConfirmation ? 'default' : 'secondary'}>
            {requiresConfirmation ? '待确认' : '可直接落地'}
          </Badge>
        </div>
        <CardDescription className="text-xs leading-5">{summary}</CardDescription>
      </CardHeader>

      {changes.length > 0 ? (
        <CardContent className="space-y-3 px-4">
          {changes.map((change) => (
            <div
              key={`${change.label}-${change.detail}`}
              className="rounded-2xl border border-black/6 bg-slate-50 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">{change.label}</p>
                {change.risk ? (
                  <span className="text-[11px] text-slate-500">
                    {RISK_LABEL[change.risk]}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600">{change.detail}</p>
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  )
}
