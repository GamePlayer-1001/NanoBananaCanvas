/**
 * [INPUT]: 依赖 @/components/ui/card 与 @/components/ui/button，依赖原始意图 / 画面提案 / 执行提示词三段文本与确认动作
 * [OUTPUT]: 对外提供 AgentPromptCompareCard 组件，展示 prompt 确认结构与交互动作
 * [POS]: components/agent 的 prompt 对比卡片，被 AgentConversation 复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AgentPromptCompareCardProps {
  payloadId?: string
  originalIntent: string
  visualProposal: string
  executionPrompt: string
  styleOptions?: string[]
  expanded?: boolean
  onConfirm?: () => void
  onRegenerate?: () => void
  onManualEdit?: () => void
  onToggleExpand?: () => void
  onStyleSelect?: (styleLabel: string) => void
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
  payloadId,
  originalIntent,
  visualProposal,
  executionPrompt,
  styleOptions = [],
  expanded = false,
  onConfirm,
  onRegenerate,
  onManualEdit,
  onToggleExpand,
  onStyleSelect,
}: AgentPromptCompareCardProps) {
  const compactPrompt =
    expanded || executionPrompt.length <= 180
      ? executionPrompt
      : `${executionPrompt.slice(0, 180)}...`

  return (
    <Card className="gap-4 rounded-3xl border-black/8 bg-white/96 py-4 shadow-sm">
      <CardHeader className="px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">Prompt 确认</CardTitle>
          {payloadId ? (
            <span className="text-muted-foreground text-[11px]">{payloadId}</span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <Section title="原始意图" body={originalIntent} />
        <Section title="画面提案" body={visualProposal} />
        <Section title="执行提示词" body={compactPrompt} />
        {executionPrompt.length > 180 ? (
          <button
            type="button"
            className="text-[12px] text-indigo-600 hover:text-indigo-700"
            onClick={onToggleExpand}
          >
            {expanded ? '收起完整 Prompt' : '展开完整 Prompt'}
          </button>
        ) : null}
        {styleOptions.length > 0 ? (
          <div className="space-y-2 rounded-2xl border border-black/6 bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-medium tracking-[0.08em] text-slate-500 uppercase">
              风格方向
            </p>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((style) => (
                <Button
                  key={style}
                  type="button"
                  variant="secondary"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => onStyleSelect?.(style)}
                >
                  {style}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" size="sm" className="rounded-full px-4" onClick={onConfirm}>
            确认并执行
          </Button>
          <Button type="button" size="sm" variant="secondary" className="rounded-full px-4" onClick={onRegenerate}>
            再来一版
          </Button>
          <Button type="button" size="sm" variant="ghost" className="rounded-full px-4" onClick={onManualEdit}>
            我自己改
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
