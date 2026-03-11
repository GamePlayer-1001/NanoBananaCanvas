# apps/web/lib/api/

> L2 | 父级: apps/web/lib/CLAUDE.md

API 路由公共基础设施

## 成员清单

```
auth.ts            — requireAuth() / optionalAuth() 认证守卫，Clerk → D1 用户映射
rate-limit.ts      — checkRateLimit / rateLimitResponse / withRateLimit KV 滑动窗口限流器，所有 API 路由消费
rate-limit.test.ts — rate-limit 模块单元测试 (Vitest, KV mock)
response.ts        — apiOk / apiError / handleApiError 统一响应，AppError → HTTP 状态码映射
```

## 限流方案

- **持久化**: Cloudflare KV 滑动窗口 (key=`rl:{identifier}`, TTL=windowMs)
- **调用方式**: `checkRateLimit` / `withRateLimit` 均为 async
- **补充**: 建议在 Cloudflare Dashboard 配置 WAF 全局 IP 级防刷规则

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
