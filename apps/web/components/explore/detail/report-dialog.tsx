/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 sonner 的 toast，
 *          依赖 @/hooks/use-explore 的 useReportWorkflow，
 *          依赖 @/components/ui/dialog, @/components/ui/button
 * [OUTPUT]: 对外提供 ReportDialog 举报弹窗组件
 * [POS]: explore/detail 的举报交互，被 action-buttons.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useReportWorkflow } from '@/hooks/use-explore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/* ─── Constants ───────────────────────────────────────── */

const REPORT_REASONS = ['spam', 'nsfw', 'copyright', 'other'] as const

/* ─── Types ──────────────────────────────────────────── */

interface ReportDialogProps {
  workflowId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/* ─── Component ──────────────────────────────────────── */

export function ReportDialog({ workflowId, open, onOpenChange }: ReportDialogProps) {
  const t = useTranslations('exploreDetail')
  const tc = useTranslations('common')
  const [selected, setSelected] = useState<string>('')
  const { mutate, isPending } = useReportWorkflow()

  const handleSubmit = () => {
    if (!selected) return
    mutate(
      { id: workflowId, reason: selected },
      {
        onSuccess: () => {
          toast.success(t('reportSubmitted'))
          onOpenChange(false)
          setSelected('')
        },
        onError: () => toast.error(t('reportFailed')),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('reportTitle')}</DialogTitle>
          <DialogDescription>{t('reportDescription')}</DialogDescription>
        </DialogHeader>

        {/* 原因选择 */}
        <div className="grid grid-cols-2 gap-2 py-2">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                selected === reason
                  ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950'
                  : 'border-border hover:bg-muted'
              }`}
              onClick={() => setSelected(reason)}
            >
              {t(`reason_${reason}`)}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!selected || isPending}
          >
            {t('submitReport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
