# api/
> L2 | 父级: apps/web/app/CLAUDE.md

Next.js App Router API 路由层 — RESTful 端点 · Clerk 认证 · AI 执行

## 成员清单

```
ai/                     — AI 模型集成 (3 端点)
  models/route.ts       — GET  模型目录 + 定价信息
  execute/route.ts      — POST 双模式 AI 执行 (积分/账号级模型槽位)
  stream/route.ts       — POST SSE 流式 AI 执行 (ctx.waitUntil 保障积分结算 + 账号级模型槽位)

credits/                — 积分系统 (3 端点)
  balance/route.ts      — GET  积分余额 (三池: monthly/permanent/frozen + 套餐信息)
  usage/route.ts        — GET  AI 使用统计 (摘要/模型/日趋势)
  transactions/route.ts — GET  交易历史 (分页 + 类型筛选)

folders/                — 文件夹 CRUD (2+2 端点)
  route.ts              — GET 列表 / POST 创建
  [id]/route.ts         — PUT 重命名 / DELETE 删除

workflows/              — 工作流 CRUD + 社交 (见子 CLAUDE.md, 支持 folder 筛选/移动)

explore/                — 社区广场 (2 端点)
  route.ts              — GET  公开列表 (分类/排序/分页/互动标记)
  search/route.ts       — GET  模糊搜索 (标题/描述/标签)

categories/route.ts     — GET  分类列表 (i18n 本地化)
notifications/route.ts  — GET+PATCH 通知列表 + 标记已读
users/me/route.ts       — GET  当前用户信息 + 首次登录自动同步
files/                  — 文件上传与读取 (见子 CLAUDE.md)
  upload/route.ts       — POST 文件上传 (R2 存储, 配额检查)
  [...key]/route.ts     — GET 读取 R2 文件 (thumbnails 公开, uploads/outputs 按用户隔离)

admin/                  — 运维管理 (1 端点)
  cleanup/route.ts      — POST 手动触发过期文件清理 (Bearer token 认证)
og/route.tsx            — GET  Open Graph 动态图片生成
health/route.ts         — GET  健康检查端点

tasks/                  — P2 异步任务队列 (3 端点)
  route.ts              — POST 提交任务 / GET 任务列表
  [id]/route.ts         — GET  任务状态查询 + 懒评估
  [id]/cancel/route.ts  — POST 取消任务 + 积分退还

settings/               — 用户设置 (2 端点)
  api-keys/route.ts             — GET+PUT 账号级模型槽位管理 (加密存储 API Key + baseUrl + modelId)
  api-keys/[provider]/route.ts  — DELETE+POST 槽位删除/连通测试

webhooks/               — 第三方回调 (2 端点)
  clerk/route.ts        — POST Clerk Webhook (用户 CRUD 同步 D1)
  stripe/route.ts       — POST Stripe Webhook (支付/订阅事件处理)
```

## 架构约定

- 认证: `requireAuth()` / `optionalAuth()` from `lib/api/auth.ts`
- 响应: `apiOk` / `handleApiError` from `lib/api/response.ts`
- 限流: `checkRateLimit` / `withRateLimit` from `lib/api/rate-limit.ts`
- 体积: `withBodyLimit` (1MB) 守护所有 POST/PUT/PATCH 端点
- 验证: Zod schema from `lib/validations/`
- 积分: 当前仍为历史执行链的一部分，后续将继续按拆除清单清理

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
