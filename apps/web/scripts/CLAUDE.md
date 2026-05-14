# scripts/

> L2 | 父级: /apps/web/CLAUDE.md

成员清单
apply-d1-migrations.mjs: D1 迁移编排器，按固定顺序逐条执行 apps/web/db 下的运行时迁移，记录 `schema_migrations` 历史并跳过重复项，支持 `--local` / `--remote`，供 CI/CD 与手工运维复用
cloudflare-deploy.mjs: Cloudflare 生产构建与部署包装器，调用 OpenNext 内部 build API，并补齐 OpenNext 配置产物/平台兼容兜底；Windows 下若缺失 `open-next.config.edge.mjs`，会从根级 `open-next.config.ts` 生成 ESM 桥接文件避免打包阶段断裂。
grant-user-entitlements.mjs: 账户授权运维脚本，按 email 向 D1 本地或远端授予指定套餐镜像，并把永久积分提升到超大值以表达人工无限额度
i18n-tools.mjs: i18n/L10N 运维脚本，负责生成 message-index/message-usage、自动抽取声明式动态 key、合并 manifest 兜底 key、校验 locale key 对称性与代码引用、同步缺失 key、清理未使用 key、创建新 locale 脚手架。
backfill-agent-audit-r2.mjs: Agent 审计历史瘦身脚本，扫描远端/本地 D1 中尚未迁移的大 JSON，上传到 R2 后把 D1 回写成索引/摘要形态
backfill-published-output-video-covers.mjs: 已发布视频封面批量回填脚本，扫描缺失 thumbnail 或误把视频地址写成 thumbnail 的公开视频，下载 R2 原视频并用 ffmpeg 抽首帧，上传封面图后回写 published_outputs.thumbnail
test-dlapi-key.mjs: DLAPI 本地联调脚本，读取 `apps/web/.env.local` 的 `DLAPI_API_KEY` 发起直出图请求并输出去除 `base64` 字段后的完整响应，供手工验 key / 验网 / 验协议。
import-explore-works.mjs: Explore 批量导入脚本，读取 CSV/JSON 清单，支持固定导入账号或 `--fake-authors` 自动建假作者 users 账号，上传本地媒体/工作流到 R2，并把外部或本地作品写入 published_outputs 为导入态公开作品；视频缺省不再把媒体文件误写入 thumbnail
export-explore-images-from-excel.mjs: Excel 嵌入图片导出脚本，解析 WPS/Excel 单元格内嵌图片、标题/提示词/Use case/workflow path，批量导出图片并生成带 categoryId/categorySlug 的 Explore JSON manifest
explore-import-manifest.example.json: Explore 导入清单示例，演示 Civitai/本地素材字段映射与 JSON manifest 结构

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
