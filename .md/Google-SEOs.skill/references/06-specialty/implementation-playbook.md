# SEO 技术实施总手册

用于需要“完整 SEO 落地方案”“技术 SEO 清单”“上线前检查”的任务。本文档整合 `seo优化.txt` 中可迁移的工程经验，并与 Google 官方文档主题保持对齐。

## 适用范围

- 新站上线前的 SEO 基础建设
- 存量站的技术 SEO 体检
- Landing page、博客、文档站、SaaS 官网的统一规范
- 需要交付实施方案、优先级和验证清单的场景

## P0 核心优化

优先完成这些低成本高影响项：

| 项目 | 目标 | 常见交付物 |
| --- | --- | --- |
| `robots.txt` | 让可抓取范围清晰，避免误封核心页面 | `public/robots.txt` |
| `sitemap.xml` | 告诉搜索引擎应重点发现哪些 URL | 静态或动态站点地图 |
| Canonical | 收敛重复内容信号 | `<link rel="canonical">` |
| 标题与描述 | 提升结果页可理解性与 CTR | 页面级 title/meta description |
| 状态码与重定向 | 避免死链、循环、错误迁移 | `301` 规则、404 模板 |

## robots.txt

目标：

- 允许正常抓取公开页面
- 阻止后台、接口、内部路径被无意义抓取
- 显式声明 sitemap 位置

基础模板：

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_internal/

Sitemap: https://example.com/sitemap.xml
```

检查点：

- 不要误写 `Disallow: /`
- 不要把 CSS、JS、图片等渲染资源误封
- 不要指望 `robots.txt` 保护敏感数据；它只能约束抓取，不等于权限控制

验证：

- 浏览器直接访问 `https://domain/robots.txt`
- Search Console / 日志验证 Googlebot 的抓取行为

## Sitemap 设计

目标：

- 覆盖应被索引的重要 URL
- 为大型站点提供分片与索引文件
- 让更新时间可被机器消费

基础字段：

| 字段 | 作用 | 建议 |
| --- | --- | --- |
| `<loc>` | 页面绝对 URL | 必填，使用规范 URL |
| `<lastmod>` | 最后更新时间 | 推荐，用实际更新时间 |
| `<changefreq>` | 更新频率提示 | 可选，不要伪造 |
| `<priority>` | 相对优先级提示 | 可选，只在站内相对比较有意义 |

规则：

- 单个 sitemap 不超过 50,000 URL
- 未压缩大小不超过 50MB
- 大站点使用 sitemap index
- 只放可返回 `200 OK` 且允许索引的 URL

实现路径建议：

- 静态站：构建时生成 `public/sitemap.xml`
- SSR / 动态站：接口按内容源实时生成并加缓存
- 超大站：拆分 posts / categories / products 等子图

## Canonical 规范

用于处理：

- 参数 URL
- 多路径访问同一内容
- HTTP / HTTPS 或带尾斜杠差异
- 复制页 / 落地页变体

原则：

- 每个可索引页面都应有自引用 canonical
- 使用绝对 URL
- Canonical 指向的页面必须可索引
- 不要把明显不同语言或不同主体内容强行 canonical 到同一页

常见错误：

- 页面声明 canonical，但目标页返回 404 / 302
- 分页、筛选页的 canonical 策略与业务目的冲突
- 把多语言版本互相 canonical，导致语言页信号被吞并

## 重定向与错误页

优先规则：

- 永久迁移使用 `301`
- 临时实验或地域跳转使用 `302` / `307`
- 删除且无替代页时返回真实 `404` 或 `410`

推荐处理：

- 统一协议、域名、尾斜杠
- 保留历史高价值 URL 的映射关系
- 避免重定向链和循环
- 404 页面提供返回入口与站内搜索，但仍返回真实 404 状态码

## 页面级 SEO

每个重要页面至少检查：

| 项目 | 要求 |
| --- | --- |
| Title | 独特、清晰、和页面主体一致 |
| Meta description | 解释页面价值，不堆砌关键词 |
| H1 | 反映页面主主题 |
| 内链 | 能被站内可抓取链接发现 |
| 图片 | 有语义化文件名与 alt 文本 |
| Schema | 与页面内容真实一致 |

建议输出：

- 页面模板级规范表
- Title / description 编写规则
- 模板字段映射清单

## 结构化数据实施

做法：

1. 先去 `references/04-structured-data/search-gallery.md` 确认目标类型是否受支持。
2. 再读对应 schema 文档确认 required / recommended 字段。
3. 仅标记页面上真实可见的内容。
4. 上线前用 Rich Results Test 与 Schema Validator 复查。

高频类型：

- `Organization`
- `WebSite`
- `BreadcrumbList`
- `Article` / `BlogPosting`
- `Product`
- `FAQPage`
- `LocalBusiness`

## 性能与 CWV

关注指标：

- `LCP < 2.5s`
- `INP < 200ms`
- `CLS < 0.1`

优先动作：

- 压缩图片并声明尺寸
- 字体预加载与子集化
- 减少阻塞脚本
- 关键内容 SSR / 预渲染
- 路由级代码分割
- 缓存静态资源

工具：

- PageSpeed Insights
- Lighthouse
- Chrome DevTools Performance

## 监控与验证

至少建立以下回路：

| 工具 | 关注点 |
| --- | --- |
| Google Search Console | 收录、覆盖、关键词、CTR |
| GA4 | 自然流量与页面行为 |
| Bing Webmaster Tools | Bing 收录与抓取 |
| Server Logs | 爬虫命中、状态码、资源浪费 |
| Rich Results Test | 富结果资格 |

上线后检查：

1. 提交 sitemap
2. 抽查核心 URL 的索引状态
3. 抽查 canonical / robots / status code
4. 验证模板页 schema
5. 监控 2 到 4 周的展示、点击与抓取变化

## 问题排查顺序

当用户说“SEO 没效果”“页面不收录”时，按这个顺序排查：

1. 页面是否能返回 `200`
2. 是否被 `robots`、`noindex`、认证、脚本错误阻塞
3. 是否有可抓取内链和 sitemap 入口
4. 是否被 canonical 合并到别处
5. 页面主体内容是否足够独特和有用
6. 是否只是新站、冷门页或需求低

## 交付模板

输出建议采用：

### 诊断结论

- 风险等级
- 核心问题
- 影响范围

### 根因拆解

- 技术层
- 内容层
- 呈现层

### 执行优先级

- `P0` 立即修复
- `P1` 本周推进
- `P2` 长期建设

### 验证方式

- 看什么指标
- 用什么工具
- 预期多久见到信号

## 上线前清单

- [ ] `robots.txt` 可访问且无误封
- [ ] `sitemap.xml` 可访问且只含有效 URL
- [ ] 关键模板都有 canonical
- [ ] 关键模板 title / description 已生成
- [ ] 404 / 301 行为正确
- [ ] 重要 schema 已验证
- [ ] GSC / Bing 已接入
- [ ] 性能指标达到可接受范围
