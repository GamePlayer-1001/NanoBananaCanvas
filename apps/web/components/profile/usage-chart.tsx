/**
 * [INPUT]: 依赖 react 的 useState，依赖 next-intl 的 useTranslations，
 *          依赖 @/hooks/use-user 的 useCreditsUsage
 * [OUTPUT]: 对外提供 UsageChart 使用统计图表组件
 * [POS]: profile/billing 的使用统计可视化，被 billing-tab.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { useCreditsUsage } from '@/hooks/use-user'

/* ─── Types ──────────────────────────────────────────────── */

interface DailyUsage {
  date: string
  calls: number
  credits: number
}

interface UsageSummary {
  totalCalls: number
  totalCredits: number
  successCount: number
  failedCount: number
  avgDurationMs: number
}

interface UsageData {
  summary: UsageSummary
  daily: DailyUsage[]
}

/* ─── Stat Card ──────────────────────────────────────────── */

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

/* ─── Bar Chart ──────────────────────────────────────────── */

function BarChart({ daily, metric }: { daily: DailyUsage[]; metric: 'calls' | 'credits' }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const values = daily.map((d) => d[metric])
  const max = Math.max(...values, 1)

  return (
    <div className="flex items-end gap-1.5" style={{ height: 120 }}>
      {daily.map((d, i) => {
        const h = (values[i] / max) * 100
        const isHover = hoverIdx === i
        const day = d.date.slice(5) // MM-DD

        return (
          <div
            key={d.date}
            className="group relative flex flex-1 flex-col items-center"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {/* Tooltip */}
            {isHover && (
              <div className="absolute -top-10 z-10 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background shadow">
                {day} · {values[i]} {metric}
              </div>
            )}

            {/* Bar */}
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-[28px] rounded-t transition-all duration-500 ease-out"
                style={{
                  height: `${Math.max(h, 4)}%`,
                  background: isHover
                    ? 'var(--brand-500)'
                    : 'linear-gradient(to top, var(--brand-400), var(--brand-300))',
                  opacity: isHover ? 1 : 0.7,
                }}
              />
            </div>

            {/* Label */}
            <span className="mt-1.5 text-[9px] text-muted-foreground">{day}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */

export function UsageChart() {
  const t = useTranslations('billing')
  const { data, isLoading } = useCreditsUsage()
  const [metric, setMetric] = useState<'calls' | 'credits'>('credits')

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-32 rounded-lg bg-muted" />
      </div>
    )
  }

  const usage = data as UsageData | undefined
  if (!usage) return null

  const { summary, daily } = usage
  const successRate = summary.totalCalls > 0
    ? Math.round((summary.successCount / summary.totalCalls) * 100)
    : 100

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-foreground">{t('usageStats')}</h4>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t('totalCalls')} value={summary.totalCalls} />
        <StatCard label={t('creditsUsed')} value={summary.totalCredits} />
        <StatCard label={t('successRate')} value={`${successRate}%`} />
      </div>

      {/* 图表切换 */}
      {daily.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-1 rounded-md bg-muted p-0.5">
            {(['credits', 'calls'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                  metric === m
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(m === 'credits' ? 'creditsUsed' : 'totalCalls')}
              </button>
            ))}
          </div>

          <BarChart daily={daily} metric={metric} />
        </div>
      )}
    </div>
  )
}
