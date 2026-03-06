/**
 * [INPUT]: 依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 TermsContent 服务条款内容组件
 * [POS]: legal 的条款页面，被 terms/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

/* ─── Component ──────────────────────────────────────── */

export function TermsContent() {
  const t = useTranslations('legal')

  return (
    <div className="mx-auto max-w-[800px] px-6 pb-20 pt-28">
      <h1 className="text-3xl font-bold text-white">{t('termsTitle')}</h1>
      <p className="mt-2 text-sm text-white/50">{t('lastUpdated', { date: '2026-03-01' })}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/70">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('terms_acceptance')}</h2>
          <p>{t('terms_acceptance_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('terms_services')}</h2>
          <p>{t('terms_services_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('terms_accounts')}</h2>
          <p>{t('terms_accounts_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('terms_content')}</h2>
          <p>{t('terms_content_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('terms_payment')}</h2>
          <p>{t('terms_payment_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('terms_termination')}</h2>
          <p>{t('terms_termination_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('terms_liability')}</h2>
          <p>{t('terms_liability_body')}</p>
        </section>
      </div>
    </div>
  )
}
