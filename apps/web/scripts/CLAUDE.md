# scripts/

> L2 | 父级: /apps/web/CLAUDE.md

成员清单
cloudflare-deploy.mjs: Cloudflare 生产构建与部署包装器，调用 OpenNext 内部 build API，并补齐 OpenNext 配置产物/平台兼容兜底。
i18n-tools.mjs: i18n/L10N 运维脚本，负责生成 message-index/message-usage、合并动态 key 清单、校验 locale key 对称性与代码引用、同步缺失 key、清理未使用 key、创建新 locale 脚手架。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
