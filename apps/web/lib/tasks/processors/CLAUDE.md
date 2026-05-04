# lib/tasks/processors/
> L2 | 父级: apps/web/lib/tasks/CLAUDE.md

Provider 处理器层 — TaskProcessor 接口的具体实现

## 成员清单

- `types.ts`: TaskProcessor 接口 + SubmitInput/SubmitResult/CheckResult/TaskOutput 类型定义；`SubmitResult/CheckResult` 现支持回写真实执行 provider/model，用于 fallback 后账本与任务真相收口
- `registry.ts`: getProcessor(taskType, provider) 工厂函数，路由到对应 Processor 实例
- `video-gen.ts`: VideoGenProcessor (可灵完整实现 + 即梦骨架)
- `image-gen.ts`: ImageGenProcessor（平台图片供应商处理器，支持 OpenAI/OpenRouter 参考图输入链路、Google Imagen 文生图、DLAPI 异步文生图与基于 `multipart/form-data` 的参考图编辑，并保留 `dlapi -> comfly` 托底）
- `image-gen.test.ts`: ImageGenProcessor 回归测试（OpenAI 兼容 url/base64、OpenRouter/兼容层参考图透传、DLAPI 异步 submit/check、DLAPI 参考图 multipart 提交、Comfly fallback、未支持参考图时快速失败）
- `audio-gen.ts`: AudioGenProcessor (OpenAI TTS 同步生成 + data URL 输出)
- `index.ts`: 桶文件，导出 getProcessor + 所有类型

## Processor 统一契约

```
submit(input, apiKey) → { externalTaskId|null, initialStatus, result? }
checkStatus(externalTaskId, apiKey) → { status, progress, result?, error? }
cancel(externalTaskId, apiKey) → void
```

## 契约补充

- **同步 Provider**: image/audio 仍可在 `submit()` 阶段直接返回 `initialStatus: 'completed'` 与 `result`，但 image 现由 service 层先落 pending，再在后台执行 `submit()` 并回写 D1/R2，避免提交请求长时间阻塞
- **参考图语义真实化**: `imageUrl` 只有在处理器已接通供应商参考图协议时才会发给上游；当前 OpenAI/OpenRouter 兼容链路已透传，DLAPI 已按 `multipart/form-data` 提交参考图编辑，Gemini 未接通时会直接报错，不再假装支持
- **异步 Provider**: video 仍通过 `externalTaskId` + `checkStatus()` 懒评估推进

## Provider 实现状态

| 任务类型   | Provider    | 状态    |
|-----------|-------------|---------|
| image_gen | openai-compatible | ✅ 完成（用户自配置） |
| image_gen | gemini      | ✅ 完成（用户自配置 / 平台内部路由） |
| image_gen | dlapi       | ✅ 完成（异步主链） |
| image_gen | comfly      | ✅ 完成（平台供应商托底） |
| video_gen | kling       | ✅ 完成  |
| video_gen | jimeng      | 🔲 骨架  |
| audio_gen | openai      | ✅ 完成（平台/用户共享实现） |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
