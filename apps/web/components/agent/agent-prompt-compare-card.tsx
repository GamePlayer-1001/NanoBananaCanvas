/**
 * [INPUT]: 依赖 @/components/ui/button，依赖原始意图 / 画面提案 / 执行提示词三段文本与确认动作
 * [OUTPUT]: 对外提供 AgentPromptCompareCard 组件，以纯文本分行方式展示 prompt 确认内容与轻交互
 * [POS]: components/agent 的 prompt 对比展示组件，被 AgentConversation 复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

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
    <div className="space-y-3 rounded-[22px] border border-black/6 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div className="space-y-1">
        <p className="text-[11px] font-medium tracking-[0.08em] text-slate-400 uppercase">
          {t('promptCardTitle')}
        </p>
        {payloadId ? (
          <p className="text-[11px] text-slate-400">{payloadId}</p>
        ) : null}
      </div>

      <div className="space-y-2 text-[13px] leading-6 text-slate-800">
        <p className="whitespace-pre-wrap">
          {t('promptOriginalIntent')}
          {'\n'}
          {originalIntent}
        </p>
        <p className="whitespace-pre-wrap">
          {t('promptVisualProposal')}
          {'\n'}
          {visualProposal}
        </p>
        <p className="whitespace-pre-wrap">
          {t('promptExecutionPrompt')}
          {'\n'}
          {compactPrompt}
        </p>
        {executionPrompt.length > 180 ? (
          <button
            type="button"
            className="text-[12px] text-indigo-600 transition-colors hover:text-indigo-700 motion-reduce:transition-none"
            onClick={onToggleExpand}
          >
            {expanded ? t('promptCollapse') : t('promptExpand')}
          </button>
        ) : null}
      </div>

        {styleOptions.length > 0 ? (
          <div className="space-y-2 pt-1">
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

      <p className="whitespace-pre-wrap text-[12px] leading-5 text-slate-500">
        {t('promptConfirmHint')}
      </p>
    </div>
  )
}
