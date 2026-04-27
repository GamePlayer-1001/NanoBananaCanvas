# Nano Banana Canvas - SEO 与 Open Graph 策略

> 文档版本：v1.1
> 创建日期：2026-03-04
> 更新日期：2026-04-21
> 关联文档：项目框架结构.md（含存储链路摘要）

---

## 一、SEO 架构总览

### 1.1 页面级 SEO 策略

| 页面          | 渲染 | SEO 重要性 | 策略                       |
| ------------- | ---- | ---------- | -------------------------- |
| Landing Page  | SSG  | **极高**   | 精心优化 meta + 结构化数据 + 可见 FAQ/GEO 语义层 |
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
    },
  }
}
```

### 1.3 当前路由现实与 canonical 原则

当前项目外部 URL 采用 `localePrefix: 'never'`，也就是对真实访问者暴露的是单一公开路径，例如：

- `/`
- `/explore`
- `/workflows`
- `/contact`

因此当前阶段的 SEO 原则不是伪造 `/en`、`/zh` 双 URL，而是：

1. 所有公开页面 canonical 指向真实外部 URL  
2. sitemap 只输出真实可访问的公开 URL  
3. 不输出虚假的 `hreflang` 互链，避免把搜索引擎引向并不存在的外部地址  
4. 多语言能力暂时通过页面内容与应用运行时承接，而不是靠独立语言 URL 承接

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

### 3.1 Landing Page — Organization + SoftwareApplication + FAQPage

```typescript
// app/[locale]/(landing)/page.tsx
// 结构化数据与页面可见内容共用同一份事实源，避免“标记里有、页面上没有”
```

落地规则：

- `Organization`：表达品牌、社媒入口、支持语言与服务覆盖区域  
- `SoftwareApplication`：表达产品类型、免费入口、核心能力  
- `FAQPage`：只标记页面上真实可见的 FAQ，不虚构问题与答案  
- GEO 语义通过“真实服务区域 + 真实团队形态 + 真实使用场景”承接，不通过批量城市页承接

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
    { url: 'https://nanobananacanvas.com/', changeFrequency: 'weekly', priority: 1.0 },
    { url: 'https://nanobananacanvas.com/explore', changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://nanobananacanvas.com/workflows', changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://nanobananacanvas.com/contact', changeFrequency: 'monthly', priority: 0.6 },
  ] as MetadataRoute.Sitemap

  // 动态页面：公开的作品
  const workflows = await getPublicWorkflows()
  const workflowPages = workflows.map((w) => ({
    url: `https://nanobananacanvas.com/explore/${w.id}`,
    lastModified: new Date(w.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

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
        allow: '/',
        disallow: [
          '/api/',
          '/account',
          '/canvas/',
          '/sign-in',
          '/sign-up',
          '/workspace/',
        ],
      },
    ],
    sitemap: 'https://nanobananacanvas.com/sitemap.xml',
  }
}
```

### 4.3 i18n SEO（保持隐藏 locale 的现状）

```typescript
// 当前不输出 hreflang 语言互链，因为外部并不存在 /en /zh 独立 URL
// 先保证 canonical 与 sitemap 完全匹配真实公开地址
```

说明：

- 如果未来要做完整多语言 SEO，必须先把真实公开 URL 结构改成可索引的多语言路径
- 在这之前，最优策略是避免输出错误的语言互链信号

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
| 2026-04-21 | v1.1 | 对齐真实隐藏 locale 路由：canonical/sitemap 改为真实公开 URL；Landing 新增 FAQ/GEO 可见语义层与 Organization/SoftwareApplication/FAQPage 结构化数据；robots 收口私有路径抓取边界 |

---

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
