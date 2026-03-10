# lib/tasks/processors/
> L2 | 父级: apps/web/lib/tasks/CLAUDE.md

Provider 处理器层 — TaskProcessor 接口的具体实现 (当前为骨架)

## 成员清单

- `types.ts`: TaskProcessor 接口 + SubmitInput/SubmitResult/CheckResult/TaskOutput 类型定义
- `registry.ts`: getProcessor(taskType, provider) 工厂函数，路由到对应 Processor 实例
- `video-gen.ts`: VideoGenProcessor 骨架 (throw not-implemented)
- `image-gen.ts`: ImageGenProcessor 骨架 (throw not-implemented)
- `audio-gen.ts`: AudioGenProcessor 骨架 (throw not-implemented)
- `index.ts`: 桶文件，导出 getProcessor + 所有类型

## Processor 统一契约

```
submit(input, apiKey) → { externalTaskId, initialStatus }
checkStatus(externalTaskId, apiKey) → { status, progress, result?, error? }
cancel(externalTaskId, apiKey) → void
```

## 扩展方式

新增 Provider: 创建 `{provider-name}.ts` 实现 TaskProcessor → 在 registry.ts 注册工厂

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
