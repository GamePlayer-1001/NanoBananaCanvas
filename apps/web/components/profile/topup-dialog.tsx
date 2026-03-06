/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/hooks/use-billing 的 usePackages / useTopup，
 *          依赖 @/components/ui/dialog, @/components/ui/button,
 *          依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 TopupDialog 积分充值弹窗
 * [POS]: profile 的充值交互，被 billing-tab.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Zap } from 'lucide-react'

import { usePackages, useTopup } from '@/hooks/use-billing'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/* ─── Types ──────────────────────────────────────────── */

interface TopupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/* ─── Component ──────────────────────────────────────── */

export function TopupDialog({ open, onOpenChange }: TopupDialogProps) {
  const t = useTranslations('billing')
  const { data, isLoading } = usePackages()
  const { mutate: topup, isPending } = useTopup()
  const [selected, setSelected] = useState<string>('')

  interface CreditPackage {
    id: string
    name: string
    credits: number
    price_cents: number
    bonus_credits: number
  }
  const response = data as { packages?: CreditPackage[] } | undefined
  const packages = response?.packages ?? []

  const handlePurchase = () => {
    if (!selected) return
    topup(selected)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap size={18} className="text-brand-500" />
            {t('topUp')}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                className={`rounded-xl border p-4 text-center transition-colors ${
                  selected === pkg.id
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <p className="text-2xl font-bold text-foreground">
                  {pkg.credits + pkg.bonus_credits}
                </p>
                {pkg.bonus_credits > 0 && (
                  <p className="text-[10px] text-emerald-500">
                    +{pkg.bonus_credits} bonus
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t('creditsLabel')}</p>
                <p className="mt-2 text-sm font-medium text-brand-600">
                  ${(pkg.price_cents / 100).toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        )}

        <Button
          className="w-full"
          disabled={!selected || isPending}
          onClick={handlePurchase}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {t('purchaseCredits')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
