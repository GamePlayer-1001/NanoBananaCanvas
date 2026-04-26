/**
 * [INPUT]: 依赖 @/lib/billing/credits 的 CreditTransactionsResult，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 PaymentHistoryTable 流水列表组件
 * [POS]: billing 的账本历史组件，被 BillingContent 消费，负责展示积分变化审计记录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import type { CreditTransactionsResult, CreditTransactionItem } from '@/lib/billing/credits'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function getAmountTone(item: CreditTransactionItem) {
  if (item.amount > 0) {
    return 'text-emerald-600'
  }

  return item.type === 'freeze' ? 'text-amber-600' : 'text-rose-600'
}

export function PaymentHistoryTable({ transactions }: { transactions: CreditTransactionsResult }) {
  const t = useTranslations('billing')

  return (
    <Card className="border-border/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <CardHeader className="border-b border-border/60">
        <CardTitle>{t('historyTitle')}</CardTitle>
        <CardDescription>
          {t('historyDescription', {
            total: transactions.total.toLocaleString(),
            shown: transactions.items.length.toLocaleString(),
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {transactions.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            {t('historyEmpty')}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <div className="grid grid-cols-[1.15fr_0.9fr_0.8fr_0.85fr] gap-3 border-b border-border/70 bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <span>{t('historyColumnEvent')}</span>
              <span>{t('historyColumnPool')}</span>
              <span className="text-right">{t('historyColumnAmount')}</span>
              <span className="text-right">{t('historyColumnBalance')}</span>
            </div>

            <div className="divide-y divide-border/60">
              {transactions.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.15fr_0.9fr_0.8fr_0.85fr] gap-3 px-4 py-4 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{item.description || item.source}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {t('historyMeta', { source: item.source, time: item.createdAt })}
                    </p>
                  </div>
                  <div className="text-muted-foreground">{t(`pool_${item.pool}`)}</div>
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
        )}
      </CardContent>
    </Card>
  )
}
