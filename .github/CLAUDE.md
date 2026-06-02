# .github/

> L2 | 父级: /CLAUDE.md

成员清单
workflows/deploy.yml: GitHub Actions 生产流水线，先执行 lint/test/build；测试前显式安装 Playwright Chromium，并为测试阶段注入 Clerk `publishable/secret` 与 Stripe 运行时变量、Price IDs、Webhook secret；部署阶段若 D1 token 权限不足则告警跳过迁移（生产 schema 已完整时安全），若 Queue 写权限不足则告警跳过创建（生产队列已存在时安全），同步 `COMFLY_API_KEY` / `DLAPI_API_KEY` 到 Web Worker 与 API Worker 时会先重试 Cloudflare Workers Secret 写入，若 token 缺少权限或 API 限流则告警降级并保留线上现有 secret 值，缺失仓库 secret 仍直接失败防止把空值覆盖到生产，最后用 OpenNext + Wrangler CLI 发布 Web 与 API Worker，并强制 JavaScript actions 运行在 Node 24。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
