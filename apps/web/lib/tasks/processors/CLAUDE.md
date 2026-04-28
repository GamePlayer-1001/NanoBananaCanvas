# lib/tasks/processors/
> L2 | 父级: apps/web/lib/tasks/CLAUDE.md

Provider 处理器层 — TaskProcessor 接口的具体实现

## 成员清单

- `types.ts`: TaskProcessor 接口 + SubmitInput/SubmitResult/CheckResult/TaskOutput 类型定义；`SubmitResult` 允许同步 provider 直接返回 `completed + result`
- `registry.ts`: getProcessor(taskType, provider) 工厂函数，路由到对应 Processor 实例
- `video-gen.ts`: VideoGenProcessor (可灵完整实现 + 即梦骨架)
- `image-gen.ts`: ImageGenProcessor (平台 OpenRouter/OpenAI 兼容图片接口 + Google Imagen 实现，复用图片能力真相源做尺寸解析与后端护栏)
- `image-gen.test.ts`: ImageGenProcessor 回归测试 (OpenAI 兼容 url/base64 双返回体 + 尺寸档位解析)
- `audio-gen.ts`: AudioGenProcessor (OpenAI TTS 同步生成 + data URL 输出)
- `index.ts`: 桶文件，导出 getProcessor + 所有类型

## Processor 统一契约

```
submit(input, apiKey) → { externalTaskId|null, initialStatus, result? }
checkStatus(externalTaskId, apiKey) → { status, progress, result?, error? }
cancel(externalTaskId, apiKey) → void
```

## 契约补充

- **同步 Provider**: image/audio 可在 `submit()` 阶段直接返回 `initialStatus: 'completed'` 与 `result`，service 层负责立即落 R2 与 completed 入库
- **异步 Provider**: video 仍通过 `externalTaskId` + `checkStatus()` 懒评估推进

## Provider 实现状态

| 任务类型   | Provider    | 状态    |
|-----------|-------------|---------|
| image_gen | openai-compatible | ✅ 完成  |
| image_gen | gemini      | ✅ 完成  |
| video_gen | kling       | ✅ 完成  |
| video_gen | jimeng      | 🔲 骨架  |
| audio_gen | openai      | ✅ 完成  |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
