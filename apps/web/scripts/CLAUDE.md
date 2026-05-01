# scripts/

> L2 | 父级: /apps/web/CLAUDE.md

成员清单
apply-d1-migrations.mjs: D1 迁移编排器，按固定顺序逐条执行 apps/web/db 下的运行时迁移，记录 `schema_migrations` 历史并跳过重复项，支持 `--local` / `--remote`，供 CI/CD 与手工运维复用
cloudflare-deploy.mjs: Cloudflare 生产构建与部署包装器，调用 OpenNext 内部 build API，并补齐 OpenNext 配置产物/平台兼容兜底；Windows 下若缺失 `open-next.config.edge.mjs`，会从根级 `open-next.config.ts` 生成 ESM 桥接文件避免打包阶段断裂。
i18n-tools.mjs: i18n/L10N 运维脚本，负责生成 message-index/message-usage、自动抽取声明式动态 key、合并 manifest 兜底 key、校验 locale key 对称性与代码引用、同步缺失 key、清理未使用 key、创建新 locale 脚手架。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
