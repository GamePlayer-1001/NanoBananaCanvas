/**
 * [INPUT]: 依赖 @/components/ui/card，依赖原始意图 / 画面提案 / 执行提示词三段文本
 * [OUTPUT]: 对外提供 AgentPromptCompareCard 组件，展示 prompt 确认占位结构
 * [POS]: components/agent 的 prompt 对比卡片，被 AgentConversation 复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface AgentPromptCompareCardProps {
  originalIntent: string
  visualProposal: string
  executionPrompt: string
  styleOptions?: string[]
}

function Section({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="space-y-1.5 rounded-2xl border border-black/6 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-medium tracking-[0.08em] text-slate-500 uppercase">
        {title}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-900">{body}</p>
    </div>
  )
}

export function AgentPromptCompareCard({
  originalIntent,
  visualProposal,
  executionPrompt,
  styleOptions = [],
}: AgentPromptCompareCardProps) {
  return (
    <Card className="gap-4 rounded-3xl border-black/8 bg-white/96 py-4 shadow-sm">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">Prompt 确认</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <Section title="原始意图" body={originalIntent} />
        <Section title="画面提案" body={visualProposal} />
        <Section title="执行提示词" body={executionPrompt} />
        {styleOptions.length > 0 ? (
          <Section title="风格方向" body={styleOptions.join(' / ')} />
        ) : null}
      </CardContent>
    </Card>
  )
}
