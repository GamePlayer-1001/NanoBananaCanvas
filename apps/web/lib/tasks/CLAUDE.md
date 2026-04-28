# lib/tasks/
> L2 | 父级: apps/web/lib/CLAUDE.md

P2 异步任务队列核心 — Method C 架构 (D1-as-Queue + 客户端驱动轮询)

## 成员清单

- `service.ts`: 核心服务层，8 大函数 (checkConcurrency/submitTask/processDeferredTask/processQueuedTask/checkTask/cancelTask/listTasks/deleteTasks)，平台模式显式读 provider/model 并接回 `freeze/confirm/refund`，user_key 模式显式读 capability/configId 且不再写平台 credits 语义；图片任务现为“submit 先落 pending + R2 持久化执行快照 + Cloudflare Queue 投递 + Worker 真后台执行 + 完成后回写 D1/R2”，彻底切断前台请求对上游长耗时的等待；持久化输入继续做 data URL 清洗，避免 D1 被超大 payload 撑爆
- `service.test.ts`: 服务层回归测试，验证平台前置失败会收敛为 TaskError，而不是漏成 UNKNOWN 500，并覆盖图片任务排队返回 / 后台完成回写 / data URL 清洗 / Queue 消费者从 R2+D1 重建执行上下文
- `index.ts`: 桶文件，统一导出 service + processors 的公共 API
- `processors/`: Provider 处理器子模块，详见 processors/CLAUDE.md

## 架构角色

```
Browser → API Route → service.ts → D1 (状态持久化)
                  ↓            ↓
              Queue Producer   R2(task-inputs 快照 / outputs 结果)
                  ↓
             Worker Consumer → service.ts(processQueuedTask) → processors/ → 外部 Provider API
```

## 关键设计

- **懒评估**: checkTask 仅在客户端 poll 时查询 Provider，节流间隔由 TASK_CONFIG 控制
- **平台任务扣费**: 平台模式异步任务会在 submit 阶段先冻结，完成时确认，失败/取消/超时时退款
- **user_key 去平台账本化**: `user_key` 模式不再写平台 credits 预估，不参与平台账本冻结/确认/退款
- **语义隔离**: API 请求体中 `provider` 只表达平台供应商，`capability` 只表达用户配置能力，避免两套密钥体系互相污染
- **失败即终态**: handleFailure 直接标记 failed，不做自动重试
- **超时检测**: checkTask 中比较 created_at vs timeoutMs，超时标记 failed
- **输出收口**: provider 返回的图片/视频/音频 URL 或 data URL 在 completed 分支统一写入账户私有 R2，再回写站内 `/api/files/...` 地址
- **图片真后台执行**: `image_gen` 不再在 submit 请求内同步等待上游出图，而是先返回 `pending`，把完整执行快照写入内部 `task-inputs/`，再投递 Cloudflare Queue，由 Worker 通过 `processQueuedTask()` 重建上下文并补完执行，彻底规避 Cloudflare 524
- **同步直落盘**: 后台执行完成后的同步图片/TTS provider 不再把 data URL 塞进 `external_task_id`，而是转存 R2，只把短 URL / 元数据落进 D1
- **持久化瘦身**: 写入 `input_data` 前递归剔除超大 data URL，保留类型/长度描述，保证任务历史可读但不污染数据库；真正执行所需的完整 payload 单独进 R2 私有快照
- **配置精确回放**: user_key 模式把选中的 `configId` 以内部 runtime meta 形式一并持久化，后续 Queue/check/cancel 都能还原到用户提交当时选中的账号级配置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
