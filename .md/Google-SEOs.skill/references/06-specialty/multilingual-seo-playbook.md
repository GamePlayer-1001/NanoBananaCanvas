# 多语言 SEO 实施手册

用于需要处理 `hreflang`、多语言 URL、区域版本、地理跳转与本地化质量的任务。本文档将 `seo优化.txt` 中的国际化经验整理为可复用规则。

## 何时使用

- 网站同时提供中英或更多语言版本
- 需要决定使用子目录、子域名还是独立域名
- 需要修复 `hreflang`、多语言 canonical、重复内容误判
- 需要制定多语言发布与验证流程

## URL 结构选择

默认优先级：

1. 子目录：`/en/`、`/zh/`
2. 子域名：`en.example.com`
3. 独立域名：`example.com`、`example.cn`
4. 参数：`?lang=en`，除非历史包袱很重，否则不推荐

推荐子目录的原因：

- 权重集中
- 运维成本低
- 模板共享容易
- Search Console 管理更直接

## hreflang 规则

每组互为语言版本的页面都应满足：

- 包含所有语言版本的互链
- 包含自引用 `hreflang`
- 包含 `x-default` 作为默认入口
- URL 必须返回 `200 OK`
- 目标页内容语言与 `hreflang` 声明一致

示例：

```html
<link rel="alternate" hreflang="en" href="https://example.com/en/page" />
<link rel="alternate" hreflang="zh-CN" href="https://example.com/zh/page" />
<link rel="alternate" hreflang="x-default" href="https://example.com/en/page" />
```

常见错误：

- 缺少自引用
- 中文页 canonical 到英文页
- 某个语言 URL 返回 302 / 404
- 页面内容几乎没翻译，只改了导航和页脚

## Canonical 与多语言的关系

原则：

- 同一语言版本内处理重复 URL 时使用 canonical
- 不同语言版本之间使用 `hreflang`，一般不要互相 canonical
- 每个语言页通常做自引用 canonical

## 本地化深度

只做字符串翻译通常不够。高风险场景：

- 货币、日期、单位仍是原站格式
- 图片 alt、标题、schema 文本没翻译
- 法律条款与支付方式没有区域差异
- 本地语言页内容明显更薄、更短或机器味很重

建议同时本地化：

- 标题与 meta description
- 导航、CTA、表单文案
- 图片 alt、图注
- 价格、货币、时间格式
- FAQ 与帮助内容
- 法务与支付信息

## 地理跳转

可以做，但要谨慎。推荐策略：

- 仅对首页或语言选择页做轻量跳转
- 使用 `302` / `307`，不要把地域判断当永久迁移
- 始终提供手动切换语言入口
- 保留 `x-default` 页面
- 不要让爬虫陷入跳转黑盒

适合的做法：

- 根据 `CF-IPCountry` 或等价 header 在首页推荐语言版本
- 记住用户手动选择，避免反复跳转

不适合的做法：

- 所有路径都按地域强制跳转
- 没有人工切换入口
- 让搜索引擎和真实用户看到完全不同的语言路由逻辑

## 多语言页面模板检查

每个语言版本都检查：

- [ ] Title 独立生成，不是硬拷贝
- [ ] Description 与语言一致
- [ ] H1 与正文首屏一致
- [ ] Canonical 自引用
- [ ] `hreflang` 完整且双向一致
- [ ] Schema 中的 `name`、`description`、`inLanguage` 合理
- [ ] 语言切换入口可抓取可访问

## 实施阶段建议

### Phase 1

- 定 URL 结构
- 建语言路由
- 加自引用 canonical
- 实现 `hreflang`

### Phase 2

- 补全深度本地化
- 本地化图片 alt / schema / 法务 / 支付信息
- 建立各语言版 sitemap

### Phase 3

- 接入 Search Console 属性
- 建 GA4 / 日志监控
- 做区域排名与收录复盘

## 验证方式

推荐工具：

- Search Console URL Inspection
- Screaming Frog `hreflang` 报表
- TechnicalSEO `hreflang` 校验工具
- 手工抓取 HTML 检查 head 标签

重点观察：

- 语言页是否被错误合并
- 非目标国家是否进入错误语言页
- 同一 query 是否出现正确的区域 landing page

## 诊断输出模板

### 现象

- 哪个语言版本有问题
- 是收录问题、排名问题还是重复内容误判

### 本质

- `hreflang` 断裂 / canonical 冲突 / 本地化过浅 / 路由策略有问题

### 修复

- `P0` 标签与路由修正
- `P1` 深度本地化
- `P2` 区域内容与持续监控
