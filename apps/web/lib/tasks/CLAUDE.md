# lib/tasks/
> L2 | 父级: apps/web/lib/CLAUDE.md

P2 异步任务队列核心 — Method C 架构 (D1-as-Queue + 客户端驱动轮询)

## 成员清单

- `service.ts`: 核心服务层，5 大函数 (checkConcurrency/submitTask/checkTask/cancelTask/listTasks)，平台模式显式读 provider/model 并接回 `freeze/confirm/refund`，user_key 模式显式读 capability/configId 且不再写平台 credits 语义，完成态统一收口媒体输出到账户级 R2
- `service.test.ts`: 服务层回归测试，验证平台前置失败会收敛为 TaskError，而不是漏成 UNKNOWN 500
- `index.ts`: 桶文件，统一导出 service + processors 的公共 API
- `processors/`: Provider 处理器子模块，详见 processors/CLAUDE.md

## 架构角色

```
Browser → API Route → service.ts → D1 (状态持久化)
                         ↓
                    processors/ → 外部 Provider API
```

## 关键设计

- **懒评估**: checkTask 仅在客户端 poll 时查询 Provider，节流间隔由 TASK_CONFIG 控制
- **平台任务扣费**: 平台模式异步任务会在 submit 阶段先冻结，完成时确认，失败/取消/超时时退款
- **user_key 去平台账本化**: `user_key` 模式不再写平台 credits 预估，不参与平台账本冻结/确认/退款
- **语义隔离**: API 请求体中 `provider` 只表达平台供应商，`capability` 只表达用户配置能力，避免两套密钥体系互相污染
- **失败即终态**: handleFailure 直接标记 failed，不做自动重试
- **超时检测**: checkTask 中比较 created_at vs timeoutMs，超时标记 failed
- **输出收口**: provider 返回的图片/视频/音频 URL 或 data URL 在 completed 分支统一写入账户私有 R2，再回写站内 `/api/files/...` 地址

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
