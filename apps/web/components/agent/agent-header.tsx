/**
 * [INPUT]: 依赖 @/components/ui/badge 的轻标签组件，依赖 @/components/ui/button 的可选动作按钮
 * [OUTPUT]: 对外提供 AgentHeader 组件，展示当前模式、上下文与轻量操作入口
 * [POS]: components/agent 的面板头部，被 AgentPanel 组合使用，不承载会话编排逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AgentHeaderProps {
  title?: string
  modeLabel?: string
  contextLabel?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  tertiaryActionLabel?: string
  onTertiaryAction?: () => void
}

export function AgentHeader({
  title = 'Agent',
  modeLabel = '开始搭建',
  contextLabel = '已连接到当前画板',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  tertiaryActionLabel,
  onTertiaryAction,
}: AgentHeaderProps) {
  const showActions = Boolean(
    (tertiaryActionLabel && onTertiaryAction) ||
    (secondaryActionLabel && onSecondaryAction) ||
    (actionLabel && onAction),
  )

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-2">
        <div className="space-y-1">
          <p className="text-foreground text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground text-xs leading-5">{contextLabel}</p>
        </div>

        <Badge
          variant="secondary"
          className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700"
        >
          {modeLabel}
        </Badge>
      </div>

      {showActions ? (
        <div className="flex shrink-0 items-center gap-2">
          {tertiaryActionLabel && onTertiaryAction ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs transition-colors motion-reduce:transition-none"
              onClick={onTertiaryAction}
            >
              {tertiaryActionLabel}
            </Button>
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs transition-colors motion-reduce:transition-none"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
          {actionLabel && onAction ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs transition-colors motion-reduce:transition-none"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
