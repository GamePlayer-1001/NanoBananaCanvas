/**
 * [INPUT]: 依赖 @/components/layout/app-sidebar 的 AppSidebar，
 *          依赖 @/components/ui/sheet，依赖 lucide-react，依赖 @/i18n/navigation
 * [OUTPUT]: 对外提供 MobileHeader 移动端顶栏组件 (汉堡菜单 + Sheet 抽屉)
 * [POS]: layout 的移动端导航，被 (app)/layout.tsx 消费，仅 < lg 可见
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { VisuallyHidden } from 'radix-ui'

/* ─── Component ──────────────────────────────────────── */

export function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-2.5 lg:hidden">
      {/* 汉堡按钮 */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        className="shrink-0"
      >
        <Menu size={18} />
      </Button>

      {/* Logo */}
      <Link href="/explore" className="flex-1">
        <h1 className="font-serif text-sm italic tracking-wide text-foreground">
          Nano Banana Canvas
        </h1>
      </Link>

      {/* Sheet 抽屉 — 复用整个 AppSidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[220px] p-0" showCloseButton={false}>
          <VisuallyHidden.Root>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden.Root>
          <div onClick={() => setOpen(false)}>
            <AppSidebar />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
