# apps/web/lib/api/

> L2 | 父级: apps/web/lib/CLAUDE.md

API 路由公共基础设施

## 成员清单

```
auth.ts       — requireAuth() / optionalAuth() 认证守卫，Clerk → D1 用户映射
rate-limit.ts — checkRateLimit / rateLimitResponse 内存滑动窗口限流器，AI/Billing 路由消费
response.ts   — apiOk / apiError / handleApiError 统一响应，AppError → HTTP 状态码映射
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
