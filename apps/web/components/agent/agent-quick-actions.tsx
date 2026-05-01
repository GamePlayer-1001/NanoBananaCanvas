/**
 * [INPUT]: 依赖 @/components/ui/button，依赖一组轻量建议动作
 * [OUTPUT]: 对外提供 AgentQuickActions 组件，展示首屏引导按钮与底部轻动作入口
 * [POS]: components/agent 的轻动作条，被 AgentPanel 组合使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface AgentQuickAction {
  id: string
  label: string
  accent?: 'default' | 'template' | 'hero'
}

interface AgentQuickActionsProps {
  actions: AgentQuickAction[]
  title?: string
  compact?: boolean
  onSelect?: (actionId: string) => void
}

export function AgentQuickActions({
  actions,
  title,
  compact = false,
  onSelect,
}: AgentQuickActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className="space-y-3">
      {title ? (
        <p className="text-[11px] font-medium tracking-[0.14em] text-slate-400 uppercase">
          {title}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2.5">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="outline"
            className={cn(
              'rounded-full border-black/8 bg-white text-slate-700 shadow-none transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700',
              compact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-sm',
              action.accent === 'template' && 'border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-950',
              action.accent === 'hero' && 'border-slate-200 bg-slate-50 text-slate-800 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700',
            )}
            onClick={() => onSelect?.(action.id)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
