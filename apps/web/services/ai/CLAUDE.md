# apps/web/services/ai/

> L2 | 父级: apps/web/services/CLAUDE.md

AI 推理服务层 · 多 Provider 可插拔架构 (OpenRouter + DeepSeek + Gemini + 平台 Key 映射)

## 成员清单

```
types.ts        — ChatMessage/ChatParams/ChatResult/AIProvider/ModelOption/ModelGroup 类型定义
provider.ts     — Provider 注册表 (registerProvider/getProvider/getPlatformKey/getAllProviders)，平台 key 映射现包含 dlapi/comfly
base-openai.ts  — BaseOpenAICompatible 抽象基类 (OpenAI 兼容 API 的公共逻辑)
openai-compatible.ts — OpenAICompatibleClient 动态 Provider (账号级自定义 baseUrl)
openrouter.ts   — OpenRouterClient (extends BaseOpenAICompatible)，静态模型目录 OPENROUTER_MODELS
deepseek.ts     — DeepSeekClient (extends BaseOpenAICompatible)，静态模型目录 DEEPSEEK_MODELS
gemini.ts       — GeminiClient (独立实现，Google Generative AI API)，静态模型目录 GEMINI_MODELS
index.ts        — 桶文件 + 自动注册所有 Provider；平台模型目录展示已迁到 `/api/ai/models`
```

## Provider 架构

```
AIProvider (interface)
  ├─ BaseOpenAICompatible (abstract class) — OpenAI 兼容 API 公共逻辑
  │     ├─ OpenRouterClient
  │     └─ DeepSeekClient
  └─ GeminiClient — 独立实现 (API 格式不兼容)
```

## 环境变量映射

```
openrouter → OPENROUTER_API_KEY
deepseek   → DEEPSEEK_API_KEY
gemini     → GEMINI_API_KEY
dlapi      → DLAPI_API_KEY
comfly     → COMFLY_API_KEY
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
