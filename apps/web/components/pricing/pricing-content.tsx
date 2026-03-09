/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @clerk/nextjs 的 useAuth，
 *          依赖 @/i18n/navigation 的 Link，依赖 @/components/ui/button，
 *          依赖 @/hooks/use-billing 的 usePlans/useCheckout，依赖 @nano-banana/shared 的 PLANS
 * [OUTPUT]: 对外提供 PricingContent 定价页客户端容器
 * [POS]: pricing 的主容器，被 pricing/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@clerk/nextjs'
import { Check, Loader2 } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useCheckout, usePlans } from '@/hooks/use-billing'
import { PLANS } from '@nano-banana/shared/constants'

/* ─── Component ──────────────────────────────────────── */

export function PricingContent() {
  const t = useTranslations('pricing')
  const { isSignedIn } = useAuth()
  const { mutate: checkout, isPending } = useCheckout()
  const { data: plansData, isLoading: plansLoading } = usePlans()

  const stripePlan = plansData?.plan
  const freePlan = PLANS.free
  const proPlan = PLANS.pro

  // 格式化价格: unitAmount 单位为分
  const formatPrice = (unitAmount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(unitAmount / 100)
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 pb-20 pt-28">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">{t('title')}</h1>
        <p className="mt-3 text-lg text-white/60">{t('subtitle')}</p>
      </div>

      {/* 套餐卡片 */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Free 套餐 */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">{t('free')}</h3>
          <div className="mt-4">
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="ml-1 text-sm text-white/50">{t('perMonth')}</span>
          </div>
          <p className="mt-2 text-sm text-white/60">
            {t('creditsIncluded', { count: freePlan.monthlyCredits })}
          </p>

          {isSignedIn ? (
            <Button className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white" disabled>
              {t('currentPlan')}
            </Button>
          ) : (
            <Link href="/sign-up">
              <Button className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white">
                {t('getStarted')}
              </Button>
            </Link>
          )}

          <ul className="mt-6 space-y-2.5">
            {freePlan.features.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-white/70">
                <Check size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro 套餐 (价格从 Stripe 拉取) */}
        <div className="relative rounded-2xl border border-brand-500 bg-brand-500/10 p-6">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-medium text-white">
            {t('popular')}
          </span>

          <h3 className="text-lg font-semibold text-white">
            {stripePlan?.name ?? proPlan.name}
          </h3>

          <div className="mt-4">
            {plansLoading ? (
              <Loader2 size={24} className="animate-spin text-white/40" />
            ) : stripePlan ? (
              <>
                <span className="text-4xl font-bold text-white">
                  {formatPrice(stripePlan.unitAmount, stripePlan.currency)}
                </span>
                <span className="ml-1 text-sm text-white/50">{t('perMonth')}</span>
              </>
            ) : (
              <span className="text-sm text-white/40">—</span>
            )}
          </div>

          <p className="mt-2 text-sm text-white/60">
            {t('creditsIncluded', { count: proPlan.monthlyCredits })}
          </p>

          {isSignedIn ? (
            <Button
              className="mt-6 w-full bg-brand-500 hover:bg-brand-600 text-white"
              disabled={isPending || !stripePlan}
              onClick={() => {
                if (stripePlan) checkout({ priceId: stripePlan.priceId })
              }}
            >
              {t('upgrade')}
            </Button>
          ) : (
            <Link href="/sign-up">
              <Button className="mt-6 w-full bg-brand-500 hover:bg-brand-600 text-white">
                {t('getStarted')}
              </Button>
            </Link>
          )}

          <ul className="mt-6 space-y-2.5">
            {proPlan.features.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-white/70">
                <Check size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
