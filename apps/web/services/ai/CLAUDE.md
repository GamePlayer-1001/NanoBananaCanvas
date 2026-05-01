# apps/web/services/ai/

> L2 | 父级: apps/web/services/CLAUDE.md

AI 推理服务层 · 多 Provider 可插拔架构 (用户自配置多协议 + 平台供应商路由)

## 成员清单

```
types.ts        — ChatMessage/ChatParams/ChatResult/AIProvider/ModelOption/ModelGroup 类型定义
provider.ts     — Provider 注册表 (registerProvider/getProvider/getPlatformKey/getAllProviders)，平台 key 映射现包含 dlapi/comfly
platform.ts     — 平台运行时门面 (平台供应商 API Key + 平台文本 Provider 构造；平台模式只认内部供应商路由)
base-openai.ts  — BaseOpenAICompatible 抽象基类 (OpenAI 兼容 API 的公共逻辑)
openai-compatible.ts — OpenAICompatibleClient 动态 Provider (账号级自定义 baseUrl)
openrouter.ts   — OpenRouterClient (extends BaseOpenAICompatible)，静态模型目录 OPENROUTER_MODELS
deepseek.ts     — DeepSeekClient (extends BaseOpenAICompatible)，静态模型目录 DEEPSEEK_MODELS
gemini.ts       — GeminiClient (独立实现，Google Generative AI API)，静态模型目录 GEMINI_MODELS
index.ts        — 桶文件 + 自动注册所有 Provider；统一导出用户自配置 Provider 与平台运行时门面
```

## Provider 架构

```
AIProvider (interface)
  ├─ BaseOpenAICompatible (abstract class) — OpenAI 兼容 API 公共逻辑
  │     ├─ OpenRouterClient
  │     └─ DeepSeekClient
  └─ GeminiClient — 独立实现 (API 格式不兼容)

Platform Runtime
  └─ platform.ts — 平台模式内部供应商路由 (不向前台暴露协议概念)
```

## 环境变量映射

```
openrouter → OPENROUTER_API_KEY
deepseek   → DEEPSEEK_API_KEY
gemini     → GEMINI_API_KEY
dlapi      → DLAPI_API_KEY
comfly     → COMFLY_API_KEY
openai     → OPENAI_API_KEY
kling      → KLING_ACCESS_KEY + KLING_SECRET_KEY
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
