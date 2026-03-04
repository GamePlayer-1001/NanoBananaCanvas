/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 Landing Page 首页
 * [POS]: (landing) 路由组的首页，SSG 渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <LandingContent />
}

function LandingContent() {
  const t = useTranslations('landing')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="from-brand-500 bg-gradient-to-r to-[#8B5CF6] bg-clip-text text-center text-5xl font-bold text-transparent md:text-7xl">
        {t('title')}
      </h1>
      <p className="mt-6 max-w-2xl text-center text-lg text-white/60">
        {t('subtitle')}
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/sign-up"
          className="bg-brand-500 hover:bg-brand-600 rounded-lg px-6 py-3 font-medium text-white transition-colors"
        >
          {t('cta')}
        </Link>
      </div>
    </main>
  )
}
