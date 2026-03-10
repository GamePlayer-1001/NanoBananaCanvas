# lib/tasks/
> L2 | 父级: apps/web/lib/CLAUDE.md

P2 异步任务队列核心 — Method C 架构 (D1-as-Queue + 客户端驱动轮询)

## 成员清单

- `service.ts`: 核心服务层，5 大函数 (checkConcurrency/submitTask/checkTask/cancelTask/listTasks)，编排 D1 + Processor + Credits
- `index.ts`: 桶文件，统一导出 service + processors 的公共 API
- `processors/`: Provider 处理器子模块，详见 processors/CLAUDE.md

## 架构角色

```
Browser → API Route → service.ts → D1 (状态持久化)
                         ↓
                    processors/ → 外部 Provider API
                         ↓
                    credits/engine → 冻结/扣费/退还
```

## 关键设计

- **懒评估**: checkTask 仅在客户端 poll 时查询 Provider，节流间隔由 TASK_CONFIG 控制
- **三阶段积分**: freeze (submit) → confirm (complete) → refund (fail/cancel/timeout)
- **重试机制**: handleFailure 检查 retry_count < max_retries，回退 pending 等下次 poll 重试
- **超时检测**: checkTask 中比较 created_at vs timeoutMs，超时标记 failed + 退还

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
