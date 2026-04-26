/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 ./video-analysis-prompts 的 VideoAnalysisResult 类型
 * [OUTPUT]: 对外提供 AnalysisResult 视频分析结果展示组件
 * [POS]: video-analysis 的结果渲染区，被 video-analysis-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import type { VideoAnalysisResult } from './video-analysis-prompts'

export function AnalysisResult({
  result,
}: {
  result: VideoAnalysisResult
}) {
  const t = useTranslations('videoAnalysis')

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-base font-semibold text-foreground">{t('resultSummaryTitle')}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('resultLogline')}
            </p>
            <p className="text-sm text-foreground">{result.videoSummary.logline || '-'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('resultVisualStyle')}
            </p>
            <p className="text-sm text-foreground">{result.videoSummary.visualStyle || '-'}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('resultNarrativeArc')}
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {result.videoSummary.narrativeArc || '-'}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-base font-semibold text-foreground">{t('resultStoryboardTitle')}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">{t('resultShot')}</th>
                <th className="px-3 py-2">{t('resultTime')}</th>
                <th className="px-3 py-2">{t('resultShotType')}</th>
                <th className="px-3 py-2">{t('resultAction')}</th>
                <th className="px-3 py-2">{t('resultEmotion')}</th>
              </tr>
            </thead>
            <tbody>
              {result.storyboard.map((shot) => (
                <tr key={`${shot.shotNumber}-${shot.startTime}`} className="border-b border-border/60 align-top">
                  <td className="px-3 py-3 text-foreground">{shot.shotNumber}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {shot.startTime} - {shot.endTime}
                  </td>
                  <td className="px-3 py-3 text-foreground">{shot.shotType || '-'}</td>
                  <td className="px-3 py-3 text-foreground">
                    <p>{shot.action || '-'}</p>
                    {shot.sceneDescription && (
                      <p className="mt-1 text-xs text-muted-foreground">{shot.sceneDescription}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-foreground">{shot.emotion || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-base font-semibold text-foreground">{t('resultScreenplayTitle')}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('resultScreenplayMeta')}
            </p>
            <div className="mt-2 space-y-1 text-sm text-foreground">
              <p>{result.screenplay.title || '-'}</p>
              <p className="text-muted-foreground">{result.screenplay.format || '-'}</p>
              <p className="text-muted-foreground">{result.screenplay.tone || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('resultPremise')}
            </p>
            <p className="mt-2 text-sm text-foreground">{result.screenplay.premise || '-'}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {result.screenplay.sceneDraft.map((scene) => (
            <div key={`${scene.sceneNumber}-${scene.timeRange}`} className="rounded-xl border border-border/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {t('resultSceneNumber', { number: scene.sceneNumber })}
                </span>
                <span className="text-xs text-muted-foreground">{scene.timeRange || '-'}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{scene.sceneHeading || '-'}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{scene.action || '-'}</p>
              {scene.dialogue.length > 0 && (
                <div className="mt-3 space-y-2">
                  {scene.dialogue.map((line, index) => (
                    <div key={`${scene.sceneNumber}-${index}`} className="text-sm text-foreground">
                      <span className="font-medium">{line.speaker || t('resultUnknownSpeaker')}</span>
                      <span className="text-muted-foreground">: </span>
                      <span>{line.line || '-'}</span>
                    </div>
                  ))}
                </div>
              )}
              {scene.voiceover && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t('resultVoiceover')}: {scene.voiceover}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-base font-semibold text-foreground">{t('resultConfidenceTitle')}</h2>
        <p className="mt-3 text-sm text-foreground">
          {t('resultConfidenceValue', { value: result.confidenceNotes.overallConfidence })}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('resultUncertainMoments')}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {(result.confidenceNotes.uncertainMoments.length > 0
                ? result.confidenceNotes.uncertainMoments
                : ['-']).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('resultMissingContext')}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {(result.confidenceNotes.missingContext.length > 0
                ? result.confidenceNotes.missingContext
                : ['-']).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
