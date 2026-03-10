/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/workflows/workflows-content
 * [OUTPUT]: 对外提供 Workflows 工作流分享页面
 * [POS]: (app) 路由组的工作流页，展示社区分享的工作流
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { WorkflowsContent } from '@/components/workflows/workflows-content'

const BASE_URL = 'https://nanobananacanvas.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('workflowsTitle'),
    description: t('workflowsDescription'),
    alternates: {
      canonical: `${BASE_URL}/${locale}/workflows`,
      languages: { en: `${BASE_URL}/en/workflows`, zh: `${BASE_URL}/zh/workflows` },
    },
    openGraph: {
      title: `${t('workflowsTitle')} | Nano Banana Canvas`,
      description: t('workflowsDescription'),
      url: `${BASE_URL}/${locale}/workflows`,
      siteName: 'Nano Banana Canvas',
      type: 'website',
    },
  }
}

/* ─── Page ───────────────────────────────────────────── */

export default async function WorkflowsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <WorkflowsContent />
}
