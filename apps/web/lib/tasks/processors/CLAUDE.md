# lib/tasks/processors/
> L2 | 父级: apps/web/lib/tasks/CLAUDE.md

Provider 处理器层 — TaskProcessor 接口的具体实现

## 成员清单

- `types.ts`: TaskProcessor 接口 + SubmitInput/SubmitResult/CheckResult/TaskOutput 类型定义
- `registry.ts`: getProcessor(taskType, provider) 工厂函数，路由到对应 Processor 实例
- `video-gen.ts`: VideoGenProcessor (可灵完整实现 + 即梦骨架)
- `image-gen.ts`: ImageGenProcessor (OpenAI 兼容图片接口 + Google Imagen 实现)
- `image-gen.test.ts`: ImageGenProcessor 回归测试 (OpenAI 兼容 url/base64 双返回体)
- `audio-gen.ts`: AudioGenProcessor (OpenAI TTS 同步生成 + data URL 输出)
- `index.ts`: 桶文件，导出 getProcessor + 所有类型

## Processor 统一契约

```
submit(input, apiKey) → { externalTaskId, initialStatus }
checkStatus(externalTaskId, apiKey) → { status, progress, result?, error? }
cancel(externalTaskId, apiKey) → void
```

## Provider 实现状态

| 任务类型   | Provider    | 状态    |
|-----------|-------------|---------|
| image_gen | openai-compatible | ✅ 完成  |
| image_gen | gemini      | ✅ 完成  |
| video_gen | kling       | ✅ 完成  |
| video_gen | jimeng      | 🔲 骨架  |
| audio_gen | openai      | ✅ 完成  |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
