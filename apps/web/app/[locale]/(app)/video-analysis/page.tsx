/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale/getTranslations，
 *          依赖 @/components/video-analysis/video-analysis-content
 * [OUTPUT]: 对外提供 Video Analysis 视频分析页面 + SEO metadata
 * [POS]: (app) 路由组的视频分析页，上传视频生成分镜/剧本
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { VideoAnalysisContent } from '@/components/video-analysis/video-analysis-content'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return buildPageMetadata({
    title: t('videoAnalysisTitle'),
    description: t('videoAnalysisDescription'),
    path: '/video-analysis',
    locale,
  })
}

/* ─── Page ───────────────────────────────────────────── */

export default async function VideoAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <VideoAnalysisContent />
}
