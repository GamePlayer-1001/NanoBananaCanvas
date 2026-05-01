/**
 * [INPUT]: 依赖 @/components/ui/sheet，依赖审计/回放摘要文案
 * [OUTPUT]: 对外提供 AgentChangeLogSheet 组件，展示最近 Agent 改图与回放摘要
 * [POS]: components/agent 的改动回看面板，被编辑器页挂载为“查看改动/回看上次改动”入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface AgentChangeLogSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  changes: string[]
}

export function AgentChangeLogSheet({
  open,
  onOpenChange,
  title,
  description,
  changes,
}: AgentChangeLogSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[360px] sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-4 pb-6">
          {changes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              暂时还没有可回看的 Agent 改动记录。
            </div>
          ) : null}

          {changes.map((change) => (
            <div
              key={change}
              className="rounded-2xl border border-black/6 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 transition-colors motion-reduce:transition-none"
            >
              {change}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
