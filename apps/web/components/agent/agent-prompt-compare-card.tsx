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
import { useTranslations } from 'next-intl'

interface AgentPromptCompareCardProps {
  payloadId?: string
  originalIntent: string
  visualProposal: string
  executionPrompt: string
  styleOptions?: string[]
  expanded?: boolean
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
  onRegenerate,
  onManualEdit,
  onToggleExpand,
  onStyleSelect,
}: AgentPromptCompareCardProps) {
  const t = useTranslations('agentPanel')
  const compactPrompt =
    expanded || executionPrompt.length <= 180
      ? executionPrompt
      : `${executionPrompt.slice(0, 180)}...`

  return (
    <Card className="gap-4 rounded-[26px] border-black/8 bg-white/96 py-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
      <CardHeader className="px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{t('promptCardTitle')}</CardTitle>
          {payloadId ? (
            <span className="text-muted-foreground text-[11px]">{payloadId}</span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <Section title={t('promptOriginalIntent')} body={originalIntent} />
        <Section title={t('promptVisualProposal')} body={visualProposal} />
        <Section title={t('promptExecutionPrompt')} body={compactPrompt} />
        {executionPrompt.length > 180 ? (
          <button
            type="button"
            className="text-[12px] text-indigo-600 transition-colors hover:text-indigo-700 motion-reduce:transition-none"
            onClick={onToggleExpand}
          >
            {expanded ? t('promptCollapse') : t('promptExpand')}
          </button>
        ) : null}
        {styleOptions.length > 0 ? (
          <div className="space-y-2 rounded-2xl border border-black/6 bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-medium tracking-[0.08em] text-slate-500 uppercase">
              {t('promptStyleOptions')}
            </p>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((style) => (
                <Button
                  key={style}
                  type="button"
                  variant="secondary"
                  className="h-8 rounded-full px-3 text-xs transition-colors motion-reduce:transition-none"
                  onClick={() => onStyleSelect?.(style)}
                >
                  {style}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="rounded-full px-4 transition-colors motion-reduce:transition-none"
            onClick={onRegenerate}
          >
            {t('promptRegenerate')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full px-4 transition-colors motion-reduce:transition-none"
            onClick={onManualEdit}
          >
            {t('promptManualEdit')}
          </Button>
        </div>
        <p className="text-[12px] leading-5 text-slate-500">
          {t('promptConfirmHint')}
        </p>
      </CardContent>
    </Card>
  )
}
