/**
 * [INPUT]: 依赖 @/lib/billing/credits 的 CreditUsageResult，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 UsageChart 用量图表组件
 * [POS]: billing 的统计组件，被 BillingContent 消费，负责展示 summary、日维度用量和模型维度消耗
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import type { CreditUsageResult } from '@/lib/billing/credits'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function calcBarWidth(value: number, max: number) {
  if (max <= 0) {
    return '0%'
  }

  return `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`
}

export function UsageChart({ usage }: { usage: CreditUsageResult }) {
  const t = useTranslations('billing')
  const maxDailyCredits = Math.max(...usage.daily.map((item) => item.estimatedCreditsSpent), 0)

  return (
    <Card className="border-border/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <CardHeader className="border-b border-border/60">
        <CardTitle>{t('usageTitle')}</CardTitle>
        <CardDescription>{t('usageDescription', { days: usage.windowDays })}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">{t('usageRequests')}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {usage.summary.totalRequests.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">{t('usageSuccess')}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {usage.summary.successCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">{t('usageFailed')}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {usage.summary.failedCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">{t('usageTokens')}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {(usage.summary.totalInputTokens + usage.summary.totalOutputTokens).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm text-indigo-700">{t('usageEstimatedCredits')}</p>
            <p className="mt-2 text-3xl font-semibold text-indigo-950">
              {usage.summary.estimatedCreditsSpent.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-foreground">{t('usageDailyTitle')}</h3>
              <span className="text-xs text-muted-foreground">{t('usageDailyHint')}</span>
            </div>
            <div className="mt-4 space-y-3">
              {usage.daily.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('usageEmpty')}
                </div>
              ) : (
                usage.daily.map((item) => (
                  <div key={item.day} className="space-y-1">
                    <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                      <span>{item.day}</span>
                      <span>
                        {t('usageDailyValue', {
                          requests: item.requestCount.toLocaleString(),
                          credits: item.estimatedCreditsSpent.toLocaleString(),
                        })}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                        style={{ width: calcBarWidth(item.estimatedCreditsSpent, maxDailyCredits) }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-foreground">{t('usageModelsTitle')}</h3>
              <span className="text-xs text-muted-foreground">{t('usageModelsHint')}</span>
            </div>
            <div className="mt-4 space-y-3">
              {usage.byModel.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('usageEmpty')}
                </div>
              ) : (
                usage.byModel.slice(0, 6).map((item) => (
                  <div key={`${item.provider}:${item.modelId}`} className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.modelId}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.provider}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {item.estimatedCreditsSpent.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('usageModelMeta', {
                            requests: item.requestCount.toLocaleString(),
                            success: item.successCount.toLocaleString(),
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
