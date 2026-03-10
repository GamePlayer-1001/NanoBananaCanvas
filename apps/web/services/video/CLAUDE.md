# apps/web/services/video/

> L2 | 父级: apps/web/services/CLAUDE.md

视频生成服务层 · 外部视频 API 客户端

## 成员清单

```
kling.ts    — KlingClient 类 (可灵 AI: JWT 认证/文生视频/图生视频/任务状态查询)
index.ts    — 桶文件，导出 KlingClient + 所有类型
```

## 可灵 API 架构

- 认证: HMAC-SHA256 JWT (access_key + secret_key)
- 文生视频: POST /v1/videos/text2video → task_id
- 图生视频: POST /v1/videos/image2video → task_id
- 状态查询: GET /v1/videos/text2video/{task_id}
- 状态流转: submitted → processing → succeed / failed

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
