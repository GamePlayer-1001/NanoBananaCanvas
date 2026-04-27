# zh/

> L2 | 父级: apps/web/app/CLAUDE.md

中文语言专属公开 SEO 入口，目前仅承载中文 sitemap，避免默认英文根入口与中文前缀入口混在同一抓取清单里。

## 成员清单

sitemap.ts: 中文专属 sitemap.xml，复用 app/sitemap 的共享构造逻辑，只输出 `/zh/*` 可索引 URL

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
