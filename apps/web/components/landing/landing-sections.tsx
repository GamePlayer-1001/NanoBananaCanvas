/**
 * [INPUT]: 依赖 react 的 useEffect/useState，依赖 landing/sections 下的各首页板块
 * [OUTPUT]: 对外提供 LandingSections 首页主体编排组件
 * [POS]: landing 的主体编排层，被 (landing)/page.tsx 消费，只负责板块组合与 rail 激活状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useState } from 'react'

import { FinalCtaSection } from '@/components/landing/sections/cta-section'
import {
  FeaturesSection,
  PricingSummarySection,
} from '@/components/landing/sections/features-pricing-section'
import {
  LANDING_SECTION_IDS,
  LandingRail,
} from '@/components/landing/sections/landing-rail'
import { ModelSection } from '@/components/landing/sections/model-section'
import { FaqSection, ProofSection } from '@/components/landing/sections/proof-faq-section'

export function LandingSections() {
  const [activeId, setActiveId] = useState<string>('hero')
  const [railVisible, setRailVisible] = useState(false)

  useEffect(() => {
    const sections = LANDING_SECTION_IDS.flatMap((id) => {
      const section = document.getElementById(id)
      return section ? [section] : []
    })
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

        if (visibleEntry?.target.id) {
          setActiveId(visibleEntry.target.id)
        }
      },
      {
        threshold: [0.2, 0.35, 0.6],
        rootMargin: '-18% 0px -30% 0px',
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    function revealRail() {
      setRailVisible(true)
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        setRailVisible(false)
      }, 1200)
    }

    function handlePointerMove(event: MouseEvent) {
      if (window.innerWidth >= 1280 && event.clientX > window.innerWidth - 180) {
        revealRail()
      }
    }

    const scrollRoot = document.querySelector('.landing-snap') ?? window
    scrollRoot.addEventListener('scroll', revealRail, { passive: true })
    window.addEventListener('mousemove', handlePointerMove)

    return () => {
      scrollRoot.removeEventListener('scroll', revealRail)
      window.removeEventListener('mousemove', handlePointerMove)
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [])

  return (
    <>
      <LandingRail activeId={activeId} visible={railVisible} />

      <div className="relative bg-[var(--landing-bg)]">
        <ModelSection />
        <FeaturesSection />
        <PricingSummarySection />
        <ProofSection />
        <FaqSection />
        <FinalCtaSection />
      </div>
    </>
  )
}
