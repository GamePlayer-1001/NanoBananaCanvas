/**
 * [INPUT]: 依赖 @/components/ui/dialog, 依赖 ./pricing-content 的 PricingContent
 * [OUTPUT]: 对外提供 PricingModal 套餐升级弹窗
 * [POS]: pricing 的弹窗入口，被 app-sidebar 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { PricingContent } from './pricing-content'

/* ─── Component ──────────────────────────────────────── */

export function PricingModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('pricing')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[860px] overflow-hidden border-white/10 bg-zinc-950 p-0"
        showCloseButton
      >
        {/* 隐藏标题 (a11y) */}
        <DialogTitle className="sr-only">{t('title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('dialogDescription')}</DialogDescription>
        <div className="max-h-[85vh] overflow-y-auto">
          <PricingContent />
        </div>
      </DialogContent>
    </Dialog>
  )
}
