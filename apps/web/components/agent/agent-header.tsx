/**
 * [INPUT]: 依赖 lucide-react 的轻图标，依赖标题/上下文文案与少量动作入口
 * [OUTPUT]: 对外提供 AgentHeader 组件，展示轻量标题、副标题与辅助动作入口
 * [POS]: components/agent 的面板头部，被 AgentPanel 组合使用，不承载会话编排逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { History, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AgentHeaderProps {
  title?: string
  subtitle?: string
  contextLabel?: string
  historyLabel?: string
  onHistoryClick?: () => void
}

export function AgentHeader({
  title = 'Agent',
  subtitle = '悬浮创作助手',
  contextLabel,
  historyLabel,
  onHistoryClick,
}: AgentHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
              <Sparkles size={14} />
            </div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
          </div>
          {subtitle ? (
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        {historyLabel && onHistoryClick ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full px-3 text-xs text-slate-500 hover:text-slate-900"
            onClick={onHistoryClick}
          >
            <History size={14} />
            {historyLabel}
          </Button>
        ) : null}
      </div>

      {contextLabel ? (
        <p className="max-w-[32rem] text-[13px] leading-6 text-slate-500">
          {contextLabel}
        </p>
      ) : null}
    </div>
  )
}
