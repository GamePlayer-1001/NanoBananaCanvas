/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/video-analysis/video-analysis-content
 * [OUTPUT]: 对外提供 Video Analysis 视频分析页面
 * [POS]: (app) 路由组的视频分析页，上传视频生成分镜/剧本
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

import { VideoAnalysisContent } from '@/components/video-analysis/video-analysis-content'

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
