/**
 * [INPUT]: 依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 PrivacyContent 隐私政策内容组件
 * [POS]: legal 的隐私页面，被 privacy/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

/* ─── Component ──────────────────────────────────────── */

export function PrivacyContent() {
  const t = useTranslations('legal')

  return (
    <div className="mx-auto max-w-[800px] px-6 pb-20 pt-28">
      <h1 className="text-3xl font-bold text-white">{t('privacyTitle')}</h1>
      <p className="mt-2 text-sm text-white/50">{t('lastUpdated', { date: '2026-04-22' })}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/70">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('privacy_collection')}</h2>
          <p>{t('privacy_collection_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('privacy_usage')}</h2>
          <p>{t('privacy_usage_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('privacy_billing')}</h2>
          <p>{t('privacy_billing_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('privacy_sharing')}</h2>
          <p>{t('privacy_sharing_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('privacy_security')}</h2>
          <p>{t('privacy_security_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('privacy_cookies')}</h2>
          <p>{t('privacy_cookies_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('privacy_rights')}</h2>
          <p>{t('privacy_rights_body')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('privacy_contact')}</h2>
          <p>{t('privacy_contact_body')}</p>
        </section>
      </div>
    </div>
  )
}
