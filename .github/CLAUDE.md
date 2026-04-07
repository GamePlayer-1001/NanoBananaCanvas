# .github/
> L2 | 父级: /CLAUDE.md

成员清单
workflows/deploy.yml: GitHub Actions 生产流水线，先执行 lint/build，再用携带 NEXT_PUBLIC_* 环境变量的 OpenNext + Wrangler CLI 部署 Web 与 API Worker，并强制 JavaScript actions 运行在 Node 24。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
