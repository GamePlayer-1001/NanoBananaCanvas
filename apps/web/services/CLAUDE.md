# apps/web/services/

> L2 | 父级: apps/web/CLAUDE.md

API 调用层 · 封装外部服务的客户端

## 成员清单

```
ai/             — AI 推理服务层 (多 Provider: OpenRouter/DeepSeek/Gemini，可插拔架构)
video/          — 视频生成服务层 (可灵 API 客户端，JWT 认证)
storage/        — 工作流持久化服务 (序列化/localStorage/导入导出)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
