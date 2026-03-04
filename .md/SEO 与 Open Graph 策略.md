# Nano Banana Canvas - SEO 与 Open Graph 策略

> 文档版本：v1.0
> 创建日期：2026-03-04
> 关联文档：项目框架结构.md、文件上传与存储策略.md

---

## 一、SEO 架构总览

### 1.1 页面级 SEO 策略

| 页面          | 渲染 | SEO 重要性 | 策略                       |
| ------------- | ---- | ---------- | -------------------------- |
| Landing Page  | SSG  | **极高**   | 精心优化 meta + 结构化数据 |
| 定价页        | SSG  | 高         | 套餐结构化数据             |
| 作品广场      | SSR  | 高         | 动态 meta + 分页 SEO       |
| 作品详情      | SSR  | **极高**   | 动态 OG 图 + 结构化数据    |
| 服务条款/隐私 | SSG  | 低         | 基础 meta                  |
| 画布编辑器    | CSR  | 无         | `noindex`                  |
| 创作空间      | SSR  | 无         | `noindex`（私有页面）      |
| 个人页面      | SSR  | 中         | 公开资料页可被索引         |

### 1.2 Next.js Metadata API

```typescript
// app/[locale]/(landing)/page.tsx

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'landing' })

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: ['AI workflow', 'visual editor', 'AI video', 'AI image'],
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      url: 'https://nanobananacanvas.com',
      siteName: 'Nano Banana Canvas',
      images: [
        {
          url: 'https://nanobananacanvas.com/og/home.png',
          width: 1200,
          height: 630,
          alt: 'Nano Banana Canvas - Visual AI Workflow Platform',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
      images: ['https://nanobananacanvas.com/og/home.png'],
    },
    alternates: {
      canonical: 'https://nanobananacanvas.com',
      languages: {
        en: '/en',
        zh: '/zh',
      },
    },
  }
}
```

---

## 二、Open Graph 动态图片

### 2.1 作品详情页 OG 图片

作品分享到社交媒体时，需要动态生成包含作品缩略图的 OG 图片。

```typescript
// app/api/og/workflow/[id]/route.tsx

import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const workflow = await getWorkflow(params.id)
  if (!workflow) return new Response('Not Found', { status: 404 })

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0B0B0F 0%, #1a1a2e 100%)',
          padding: 60,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>
            Nano Banana Canvas
          </span>
        </div>

        {/* 作品信息 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 40 }}>
          {/* 缩略图 */}
          {workflow.thumbnail_url && (
            <img
              src={workflow.thumbnail_url}
              width={400}
              height={300}
              style={{ borderRadius: 12, objectFit: 'cover' }}
            />
          )}
          {/* 标题和描述 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ color: '#fff', fontSize: 40, fontWeight: 700, lineClamp: 2 }}>
              {workflow.name}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22, lineClamp: 3 }}>
              {workflow.description}
            </span>
          </div>
        </div>

        {/* 底部统计 */}
        <div style={{ display: 'flex', gap: 32, color: 'rgba(255,255,255,0.5)', fontSize: 20 }}>
          <span>{workflow.like_count} likes</span>
          <span>{workflow.clone_count} clones</span>
          <span>by {workflow.author_name}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

### 2.2 作品详情页 Metadata

```typescript
// app/[locale]/(app)/explore/[id]/page.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const workflow = await getWorkflow(params.id)
  if (!workflow) return { title: 'Not Found' }

  return {
    title: `${workflow.name} | Nano Banana Canvas`,
    description: workflow.description ?? 'AI workflow created on Nano Banana Canvas',
    openGraph: {
      title: workflow.name,
      description: workflow.description ?? '',
      images: [`/api/og/workflow/${params.id}`],
      type: 'article',
      authors: [workflow.author_name],
    },
    twitter: {
      card: 'summary_large_image',
      title: workflow.name,
      images: [`/api/og/workflow/${params.id}`],
    },
  }
}
```

---

## 三、结构化数据

### 3.1 Landing Page — WebSite + SoftwareApplication

```typescript
// components/landing/structured-data.tsx

export function LandingStructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Nano Banana Canvas',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '150',
      priceCurrency: 'USD',
      offerCount: 4,
    },
    description: 'Visual AI Workflow Platform for creating images, videos, and audio with 30+ AI models.',
    featureList: [
      'Node-based visual editor',
      '30+ AI models integration',
      'Cloud rendering',
      'Community sharing',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

### 3.2 作品详情页 — CreativeWork

```typescript
export function WorkflowStructuredData({ workflow }: { workflow: Workflow }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: workflow.name,
    description: workflow.description,
    author: {
      '@type': 'Person',
      name: workflow.author_name,
    },
    dateCreated: new Date(workflow.created_at).toISOString(),
    datePublished: new Date(workflow.published_at).toISOString(),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: workflow.like_count,
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

### 3.3 定价页 — Product + Offer

```typescript
export function PricingStructuredData({ plans }: { plans: Plan[] }) {
  const jsonLd = plans.map(plan => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Nano Banana Canvas ${plan.name}`,
    description: plan.description,
    offers: {
      '@type': 'Offer',
      price: plan.monthly_price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2027-12-31',
    },
  }))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

---

## 四、技术 SEO

### 4.1 Sitemap

```typescript
// app/sitemap.ts

import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静态页面
  const staticPages = [
    { url: 'https://nanobananacanvas.com/en', changeFrequency: 'weekly', priority: 1.0 },
    { url: 'https://nanobananacanvas.com/zh', changeFrequency: 'weekly', priority: 1.0 },
    {
      url: 'https://nanobananacanvas.com/en/pricing',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://nanobananacanvas.com/zh/pricing',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://nanobananacanvas.com/en/explore',
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://nanobananacanvas.com/zh/explore',
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ] as MetadataRoute.Sitemap

  // 动态页面：公开的作品
  const workflows = await getPublicWorkflows()
  const workflowPages = workflows.flatMap((w) => [
    {
      url: `https://nanobananacanvas.com/en/explore/${w.id}`,
      lastModified: new Date(w.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `https://nanobananacanvas.com/zh/explore/${w.id}`,
      lastModified: new Date(w.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ])

  return [...staticPages, ...workflowPages]
}
```

### 4.2 Robots.txt

```typescript
// app/robots.ts

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/en/',
          '/zh/',
          '/en/explore/',
          '/zh/explore/',
          '/en/pricing',
          '/zh/pricing',
        ],
        disallow: [
          '/api/',
          '/en/workspace/',
          '/zh/workspace/',
          '/en/profile/',
          '/zh/profile/',
          '/en/billing/',
          '/zh/billing/',
        ],
      },
    ],
    sitemap: 'https://nanobananacanvas.com/sitemap.xml',
  }
}
```

### 4.3 i18n SEO

```typescript
// app/[locale]/layout.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    alternates: {
      canonical: `https://nanobananacanvas.com/${params.locale}`,
      languages: {
        en: '/en',
        zh: '/zh',
        'x-default': '/en',
      },
    },
  }
}
```

**`hreflang` 标签** 由 Next.js `alternates.languages` 自动生成：

```html
<link rel="alternate" hreflang="en" href="https://nanobananacanvas.com/en" />
<link rel="alternate" hreflang="zh" href="https://nanobananacanvas.com/zh" />
<link rel="alternate" hreflang="x-default" href="https://nanobananacanvas.com/en" />
```

---

## 五、社交分享优化

### 5.1 分享场景与 OG 图

| 分享场景 | OG 图来源                    | 尺寸     |
| -------- | ---------------------------- | -------- |
| 首页链接 | 静态 `/og/home.png`          | 1200×630 |
| 定价页   | 静态 `/og/pricing.png`       | 1200×630 |
| 作品详情 | 动态 `/api/og/workflow/{id}` | 1200×630 |
| 广场首页 | 静态 `/og/explore.png`       | 1200×630 |

### 5.2 静态 OG 图设计规范

- 背景：深色渐变（同 Landing 配色）
- Logo + 标语
- 1200×630 PNG
- 文件放在 `public/og/` 目录
- 优化至 < 300KB

---

## 六、性能 SEO

### 6.1 Core Web Vitals 目标

| 指标    | 目标    | 策略                      |
| ------- | ------- | ------------------------- |
| LCP     | < 2.5s  | SSG 页面 + CDN + 图片优化 |
| FID/INP | < 100ms | 延迟加载非关键 JS         |
| CLS     | < 0.1   | 预留图片/动画占位空间     |

### 6.2 图片优化

```typescript
// 使用 Next.js Image 组件
import Image from 'next/image'

<Image
  src={workflow.thumbnail_url}
  alt={workflow.name}
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 6.3 字体优化

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // 避免 FOIT
  variable: '--font-inter',
})
```

---

## 七、更新日志

| 日期       | 版本 | 变更内容                                                          |
| ---------- | ---- | ----------------------------------------------------------------- |
| 2026-03-04 | v1.0 | 初始版本：SEO 架构、动态 OG 图生成、结构化数据、Sitemap、i18n SEO |

---

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
