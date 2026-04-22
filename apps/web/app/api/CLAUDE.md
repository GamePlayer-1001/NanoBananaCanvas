# api/
> L2 | 父级: apps/web/app/CLAUDE.md

Next.js App Router API 路由层 — RESTful 端点 · SessionActor 上下文 · AI 执行

## 成员清单

```
billing/                — Stripe 计费入口 (6 端点)
  checkout/route.ts     — POST 套餐/积分包 Checkout Session 创建 (登录必需，服务端解析真实 Price)
  packages/route.ts     — GET  公开积分包目录 (Stripe 拉价 + IP/currency 解析)
  portal/route.ts       — POST Customer Portal Session 创建 (登录必需，返回 Stripe 订阅管理链接)
  subscription/route.ts — GET 当前用户订阅镜像摘要 (登录必需)
  cancel/route.ts       — POST 自动月付到期取消 (登录必需)
  topup/route.ts        — POST 积分包充值 (登录必需，只接 packageId/currency)

credits/                — 积分账本读取入口 (3 端点)
  balance/route.ts      — GET 当前用户双池积分余额摘要 (登录必需)
  transactions/route.ts — GET 当前用户积分流水分页结果 (登录必需)
  usage/route.ts        — GET 当前用户 usage 聚合摘要 (登录必需)

pricing/                — 公开定价目录 (1 端点)
  plans/route.ts        — GET 动态套餐目录 (Stripe 拉价 + IP/currency 解析)

ai/                     — AI 模型集成 (3 端点)
  models/route.ts       — GET  统一免费模型目录
  execute/route.ts      — POST 双模式 AI 执行 (平台模式已接回预冻结/确认/失败退款，user_key 继续只记 usage)
  execute/route.test.ts — 非流式执行计费编排回归测试
  stream/route.ts       — POST SSE 流式 AI 执行 (平台模式已接回预冻结/确认/失败退款，user_key 继续只记 usage)

folders/                — 文件夹 CRUD (2+2 端点)
  route.ts              — GET 列表 / POST 创建
  [id]/route.ts         — PUT 重命名 / DELETE 删除

workflows/              — 工作流 CRUD + 社交 (见子 CLAUDE.md, 支持 folder 筛选/移动)

explore/                — 社区广场 (2 端点)
  route.ts              — GET  公开列表 (分类/排序/分页/互动标记)
  search/route.ts       — GET  模糊搜索 (标题/描述/标签)

categories/route.ts     — GET  分类列表 (i18n 本地化)
notifications/route.ts  — GET+PATCH 通知列表 + 标记已读
users/me/route.ts       — GET  当前 actor 账户镜像
files/                  — 文件上传与读取 (见子 CLAUDE.md)
  upload/route.ts       — POST 文件上传 (R2 存储, 配额检查)
  [...key]/route.ts     — GET 读取 R2 文件 (thumbnails 公开, uploads/outputs 按用户隔离)

admin/                  — 运维管理 (1 端点)
  cleanup/route.ts      — POST 手动触发过期文件清理 (Bearer token 认证)
og/route.tsx            — GET  Open Graph 动态图片生成
health/route.ts         — GET  健康检查端点
webhooks/               — 外部账户与计费事件同步 (2 端点)
  clerk/route.ts        — POST Clerk 用户 webhook (created/updated/deleted)
  stripe/route.ts       — POST Stripe 账单 webhook (checkout/invoice/subscription)

tasks/                  — P2 异步任务队列 (3 端点)
  route.ts              — POST 提交任务 / GET 任务列表
  [id]/route.ts         — GET  任务状态查询 + 懒评估
  [id]/cancel/route.ts  — POST 取消任务

settings/               — 用户设置 (2 端点)
  api-keys/route.ts             — GET+PUT 账号级 API 配置列表管理 (多条配置 + 名称 + 加密存储 API Key/baseUrl/modelId)
  api-keys/[provider]/route.ts  — DELETE+POST 配置删除/连通测试 (按配置 ID)

```

## 架构约定

- 认证: `requireAuth()` / `optionalAuth()` / `requireAuthenticatedAuth()` from `lib/api/auth.ts`，当前统一返回 SessionActor 兼容视图
- 响应: `apiOk` / `handleApiError` from `lib/api/response.ts`
- 限流: `checkRateLimit` / `withRateLimit` from `lib/api/rate-limit.ts`
- 体积: `withBodyLimit` (1MB) 守护所有 POST/PUT/PATCH 端点
- 验证: Zod schema from `lib/validations/`
- 商业化: Stripe Checkout、Topup、Portal、订阅摘要/取消、余额摘要、Webhook、公开价格目录与积分包目录已接回最小闭环；`ai/execute` 与 `ai/stream` 已接回平台模式 credits 预冻结/确认/失败退款，`tasks/worker` 仍待继续收口

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
