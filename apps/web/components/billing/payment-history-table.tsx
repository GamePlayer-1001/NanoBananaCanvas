/**
 * [INPUT]: 依赖 react 的状态与副作用，依赖 @/lib/billing/credits 的 CreditTransactionsResult，
 *          依赖 next-intl 的翻译与格式化，依赖账本分页 API 与 select/button/ui/card
 * [OUTPUT]: 对外提供 PaymentHistoryTable 流水列表组件
 * [POS]: billing 的账本历史组件，被 BillingContent 与账户仪表盘消费，负责展示积分变化审计记录、分页与事件本地化
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'

import type { CreditTransactionsResult, CreditTransactionItem } from '@/lib/billing/credits'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const TASK_CONFIRM_SOURCES = new Set(['task_platform_confirm'])
const TASK_REFUND_SOURCES = new Set([
  'task_platform_refund',
  'task_platform_adjust',
  'task_submit_platform_failure_refund',
  'task_submit_platform_insert_refund',
  'task_platform_cancel_refund',
  'task_platform_failure_refund',
  'task_platform_timeout_refund',
])

type ExecutionChannel =
  | 'text'
  | 'agent'
  | 'video-analysis'
  | 'image'
  | 'video'
  | 'audio'
  | 'generic'

function getAmountTone(item: CreditTransactionItem) {
  if (item.amount > 0) {
    return 'text-emerald-600'
  }

  return item.type === 'freeze' ? 'text-amber-600' : 'text-rose-600'
}

function getPoolLabelKey(pool: CreditTransactionItem['pool']) {
  return `pool_${pool}`
}

function extractSigninDate(item: CreditTransactionItem) {
  const referenceMatch = item.referenceId?.match(/^signin_(\d{4}-\d{2}-\d{2})$/)
  if (referenceMatch) {
    return referenceMatch[1]
  }

  const descriptionMatch = item.description.match(/(\d{4}-\d{2}-\d{2})/)
  return descriptionMatch?.[1] ?? null
}

function getExecutionChannel(item: CreditTransactionItem): ExecutionChannel {
  switch (item.source) {
    case 'ai_execute_platform_confirm':
    case 'ai_execute_platform_failure_refund':
      return 'text'
    case 'ai_stream_platform_confirm':
    case 'ai_stream_platform_failure_refund':
      return 'agent'
    case 'video_analysis_platform_confirm':
    case 'video_analysis_platform_refund':
      return 'video-analysis'
    default:
      break
  }

  if (TASK_CONFIRM_SOURCES.has(item.source) || TASK_REFUND_SOURCES.has(item.source)) {
    switch (item.taskType) {
      case 'image_gen':
        return 'image'
      case 'video_gen':
        return 'video'
      case 'audio_gen':
        return 'audio'
      default:
        return 'generic'
    }
  }

  return 'generic'
}

function buildExecutionLabelKey(
  item: CreditTransactionItem,
  kind: 'event' | 'source',
): string {
  const prefix = kind === 'event' ? 'historyEvent' : 'historySource'
  const suffix =
    item.type === 'refund'
      ? 'Refund'
      : item.type === 'spend'
        ? 'Charge'
        : null

  if (!suffix) {
    return `${prefix}GenericCharge`
  }

  switch (getExecutionChannel(item)) {
    case 'text':
      return `${prefix}Text${suffix}`
    case 'agent':
      return `${prefix}Agent${suffix}`
    case 'video-analysis':
      return `${prefix}VideoAnalysis${suffix}`
    case 'image':
      return `${prefix}Image${suffix}`
    case 'video':
      return `${prefix}Video${suffix}`
    case 'audio':
      return `${prefix}Audio${suffix}`
    default:
      return `${prefix}Generic${suffix}`
  }
}

function buildSourceLabel(
  t: ReturnType<typeof useTranslations>,
  item: CreditTransactionItem,
) {
  switch (item.source) {
    case 'daily_signin_reward':
      return t('historySourceDailySigninReward')
    case 'stripe_subscription_renewal':
      return t('historySourceStripeSubscriptionRenewal')
    case 'stripe_plan_one_time':
      return t('historySourceStripePlanOneTime')
    case 'stripe_credit_pack':
      return t('historySourceStripeCreditPack')
    case 'stripe_subscription_downgrade':
      return t('historySourceStripeSubscriptionDowngrade')
    case 'ai_execute_platform_confirm':
    case 'ai_stream_platform_confirm':
    case 'video_analysis_platform_confirm':
    case 'task_platform_confirm':
    case 'ai_execute_platform_failure_refund':
    case 'ai_stream_platform_failure_refund':
    case 'video_analysis_platform_refund':
    case 'task_platform_refund':
    case 'task_platform_adjust':
    case 'task_submit_platform_failure_refund':
    case 'task_submit_platform_insert_refund':
    case 'task_platform_cancel_refund':
    case 'task_platform_failure_refund':
    case 'task_platform_timeout_refund':
      return t(buildExecutionLabelKey(item, 'source'))
    default:
      return item.source
  }
}

function buildEventLabel(
  t: ReturnType<typeof useTranslations>,
  item: CreditTransactionItem,
) {
  if (item.source === 'daily_signin_reward') {
    return t('historyEventDailySigninReward', {
      date: extractSigninDate(item) ?? item.createdAt.slice(0, 10),
    })
  }

  switch (item.source) {
    case 'stripe_subscription_renewal':
      return t('historyEventStripeSubscriptionRenewal')
    case 'stripe_plan_one_time':
      return t('historyEventStripePlanOneTime')
    case 'stripe_credit_pack':
      return t('historyEventStripeCreditPack')
    case 'stripe_subscription_downgrade':
      return t('historyEventStripeSubscriptionDowngrade')
    case 'ai_execute_platform_confirm':
    case 'ai_stream_platform_confirm':
    case 'video_analysis_platform_confirm':
    case 'task_platform_confirm':
    case 'ai_execute_platform_failure_refund':
    case 'ai_stream_platform_failure_refund':
    case 'video_analysis_platform_refund':
    case 'task_platform_refund':
    case 'task_platform_adjust':
    case 'task_submit_platform_failure_refund':
    case 'task_submit_platform_insert_refund':
    case 'task_platform_cancel_refund':
    case 'task_platform_failure_refund':
    case 'task_platform_timeout_refund':
      return t(buildExecutionLabelKey(item, 'event'))
    default:
      return item.description || buildSourceLabel(t, item)
  }
}

export function PaymentHistoryTable({
  transactions,
  isAuthenticated,
}: {
  transactions: CreditTransactionsResult
  isAuthenticated?: boolean
}) {
  const t = useTranslations('billing')
  const format = useFormatter()
  const initialPageSize = PAGE_SIZE_OPTIONS.includes(transactions.pageSize as 10 | 20 | 50)
    ? transactions.pageSize
    : 10
  const [page, setPage] = useState(Math.max(transactions.page, 1))
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [data, setData] = useState(transactions)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const skipInitialFetchRef = useRef(true)
  const totalPages = Math.max(1, Math.ceil(data.total / Math.max(pageSize, 1)))

  useEffect(() => {
    setData(transactions)
    setPage(Math.max(transactions.page, 1))
    setPageSize(
      PAGE_SIZE_OPTIONS.includes(transactions.pageSize as 10 | 20 | 50)
        ? transactions.pageSize
        : 10,
    )
    skipInitialFetchRef.current = true
  }, [transactions])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false
      return
    }

    let cancelled = false

    async function loadTransactions() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await fetch(`/api/credits/transactions?page=${page}&pageSize=${pageSize}`, {
          cache: 'no-store',
        })
        const payload = (await response.json()) as {
          ok: boolean
          data?: CreditTransactionsResult
          error?: { message?: string }
        }

        if (!response.ok || !payload.ok || !payload.data) {
          throw new Error(payload.error?.message ?? t('historyLoadFailed'))
        }

        if (!cancelled) {
          setData(payload.data)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : t('historyLoadFailed'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadTransactions()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, page, pageSize, t])

  return (
    <Card className="border-border/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>{t('historyTitle')}</CardTitle>
            <CardDescription>
              {t('historyDescription', {
                total: data.total.toLocaleString(),
                shown: data.items.length.toLocaleString(),
              })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{t('historyPageSizeLabel')}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPage(1)
                setPageSize(Number(value))
              }}
              disabled={!isAuthenticated || isLoading}
            >
              <SelectTrigger size="sm" className="h-9 min-w-[104px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {t('historyPageSizeOption', { count: option })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {data.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            {t('historyEmpty')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <div className="grid grid-cols-[1.15fr_0.9fr_0.8fr_0.85fr] gap-3 border-b border-border/70 bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <span>{t('historyColumnEvent')}</span>
                <span>{t('historyColumnPool')}</span>
                <span className="text-right">{t('historyColumnAmount')}</span>
                <span className="text-right">{t('historyColumnBalance')}</span>
              </div>

              <div className="divide-y divide-border/60">
                {data.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.15fr_0.9fr_0.8fr_0.85fr] gap-3 px-4 py-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{buildEventLabel(t, item)}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {t('historyMeta', {
                          source: buildSourceLabel(t, item),
                          time: format.dateTime(new Date(item.createdAt), {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        })}
                      </p>
                    </div>
                    <div className="text-muted-foreground">{t(getPoolLabelKey(item.pool))}</div>
                    <div className={`text-right font-semibold ${getAmountTone(item)}`}>
                      {item.amount > 0 ? '+' : ''}
                      {item.amount.toLocaleString()}
                    </div>
                    <div className="text-right text-foreground">
                      {item.balanceAfter.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                {t('historyPaginationSummary', {
                  page: data.page.toLocaleString(),
                  totalPages: totalPages.toLocaleString(),
                })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={!isAuthenticated || isLoading || page <= 1}
                >
                  {t('historyPreviousPage')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={!isAuthenticated || isLoading || page >= totalPages}
                >
                  {t('historyNextPage')}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-xs text-muted-foreground">{t('historyLoading')}</div>
            ) : null}
            {loadError ? (
              <div className="text-xs text-rose-600">{loadError}</div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
