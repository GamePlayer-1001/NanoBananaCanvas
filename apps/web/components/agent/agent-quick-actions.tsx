/**
 * [INPUT]: 依赖 @/components/ui/button，依赖一组轻量建议动作
 * [OUTPUT]: 对外提供 AgentQuickActions 组件，展示面板底部建议入口
 * [POS]: components/agent 的轻动作条，被 AgentPanel 组合使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Button } from '@/components/ui/button'

export interface AgentQuickAction {
  id: string
  label: string
}

interface AgentQuickActionsProps {
  actions: AgentQuickAction[]
  onSelect?: (actionId: string) => void
}

export function AgentQuickActions({
  actions,
  onSelect,
}: AgentQuickActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          type="button"
          variant="secondary"
          className="h-8 rounded-full bg-indigo-500/8 px-3 text-xs text-slate-700 hover:bg-indigo-500/14"
          onClick={() => onSelect?.(action.id)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
