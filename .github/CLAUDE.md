# .github/
> L2 | 父级: /CLAUDE.md

成员清单
workflows/deploy.yml: GitHub Actions 生产流水线，先执行 lint/test/build；测试阶段显式注入 Clerk + Stripe 运行时变量与 Price IDs，部署阶段再用 OpenNext + Wrangler CLI 发布 Web 与 API Worker，并强制 JavaScript actions 运行在 Node 24。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
