# Nano Banana Canvas - AI Provider 适配层设计

> 文档版本：v1.0
> 创建日期：2026-03-04
> 关联文档：archive/差距分析报告.md、异步任务队列架构设计.md、项目框架结构.md

---

## 一、设计目标

将各 AI 服务商的 SDK 差异封装为统一接口，使上层业务代码（积分扣费、任务队列、画布节点执行）无需关心底层 Provider 的协议差异。

### 1.1 核心抽象

```typescript
// packages/shared/src/types/ai-provider.ts

/* ============================================ */
/*  AI Provider 统一接口层                        */
/*  所有 Provider 必须实现此接口                   */
/* ============================================ */

export interface AIProviderConfig {
  provider: ProviderName
  apiKey: string
  baseUrl?: string
  timeout?: number
}

export type ProviderName =
  | 'openrouter'
  | 'deepseek'
  | 'gemini'
  | 'kling'
  | 'runway'
  | 'sora'
  | 'flux'
  | 'elevenlabs'
  | 'stable-diffusion'

export type TaskCategory = 'text' | 'image' | 'video' | 'audio'

export type ExecutionMode = 'sync' | 'async'

export interface AIRequest {
  model: string
  input: Record<string, unknown>
  stream?: boolean
}

export interface AIResponse {
  id: string
  status: 'completed' | 'pending' | 'failed'
  output?: Record<string, unknown>
  error?: string
}

export interface AIStreamChunk {
  type: 'text_delta' | 'progress' | 'complete' | 'error'
  data: unknown
}

export interface AIProvider {
  name: ProviderName
  category: TaskCategory
  executionMode: ExecutionMode

  execute(req: AIRequest): Promise<AIResponse>
  executeStream?(req: AIRequest): AsyncGenerator<AIStreamChunk>
  checkTaskStatus?(externalTaskId: string): Promise<AIResponse>
  cancelTask?(externalTaskId: string): Promise<void>
}
```

---

## 二、Provider SDK 差异分析

### 2.1 协议差异矩阵

| Provider             | 协议                 | 认证方式            | 执行模式              | 响应格式        | 特殊处理                                    |
| -------------------- | -------------------- | ------------------- | --------------------- | --------------- | ------------------------------------------- |
| **OpenRouter**       | REST (OpenAI 兼容)   | Bearer Token        | 同步/流式 SSE         | OpenAI 格式     | 模型路由前缀 `provider/model`               |
| **DeepSeek**         | REST (OpenAI 兼容)   | Bearer Token        | 同步/流式 SSE         | OpenAI 格式     | 中国区域优化，支持 FIM                      |
| **Google Gemini**    | REST (Google AI)     | API Key query param | 同步/流式 SSE         | Google 私有格式 | `generateContent` / `streamGenerateContent` |
| **Kling (快影)**     | REST                 | Bearer Token        | **异步**（提交→轮询） | 私有格式        | 视频生成需轮询 `task_id`，耗时 2-5 min      |
| **Runway**           | REST + **WebSocket** | Bearer Token        | **异步**（WS 推送）   | 私有格式        | Gen-3 用 WS 接收进度，HTTP 提交             |
| **Sora**             | REST (OpenAI)        | Bearer Token        | **异步**（提交→轮询） | OpenAI 格式     | 排队机制，有等待时间                        |
| **FLUX (BFL)**       | REST                 | API Key Header      | **异步**（提交→轮询） | 私有格式        | 图片生成，result_url 返回                   |
| **ElevenLabs**       | REST                 | API Key Header      | 同步（流式音频）      | 音频流 Binary   | 返回 audio/mpeg 流                          |
| **Stable Diffusion** | REST (多平台)        | 因平台而异          | 同步/异步             | 因平台而异      | 通过 Stability AI API 或 Replicate          |

### 2.2 关键差异详解

#### 2.2.1 同步 Provider（LLM 文本生成）

```
OpenRouter / DeepSeek / Gemini
├── 请求：POST /chat/completions (或等效)
├── 响应：立即返回结果或 SSE 流
├── 超时：30-120s
└── 错误：HTTP 状态码 + JSON error body
```

**统一处理**：直接代理转发，SSE 透传给前端。

#### 2.2.2 异步 Provider（图片/视频生成）

```
Kling / Runway / Sora / FLUX
├── 步骤一：POST 提交任务 → 返回 task_id / generation_id
├── 步骤二：轮询 GET /task/{id} → 返回 status + progress
├── 步骤三：完成后 → 返回 result_url（CDN 链接）
├── 超时：30s-600s（视频生成最长）
└── 特殊：Runway 用 WebSocket 推送进度
```

**统一处理**：

1. Worker 提交任务，拿到 external_task_id
2. 存入 D1 `async_tasks` 表
3. Cloudflare Queues 调度轮询
4. 完成后下载到 R2，更新任务状态

#### 2.2.3 音频流 Provider

```
ElevenLabs
├── 请求：POST /text-to-speech/{voice_id}
├── 响应：audio/mpeg 二进制流
├── 处理：流式写入 R2，返回 R2 URL
└── 超时：10-30s
```

---

## 三、Provider 实现

### 3.1 基类

```typescript
// apps/worker/src/services/ai-providers/base.ts

export abstract class BaseAIProvider implements AIProvider {
  abstract name: ProviderName
  abstract category: TaskCategory
  abstract executionMode: ExecutionMode

  protected apiKey: string
  protected baseUrl: string
  protected timeout: number

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? this.defaultBaseUrl()
    this.timeout = config.timeout ?? 30_000
  }

  protected abstract defaultBaseUrl(): string

  abstract execute(req: AIRequest): Promise<AIResponse>

  protected async httpPost(
    path: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      return await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.authHeaders(),
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  protected authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.apiKey}` }
  }
}
```

### 3.2 OpenAI 兼容层（OpenRouter / DeepSeek）

```typescript
// apps/worker/src/services/ai-providers/openai-compatible.ts

export class OpenAICompatibleProvider extends BaseAIProvider {
  name: ProviderName
  category: TaskCategory = 'text'
  executionMode: ExecutionMode = 'sync'

  constructor(name: ProviderName, config: AIProviderConfig) {
    super(config)
    this.name = name
  }

  protected defaultBaseUrl(): string {
    const urls: Record<string, string> = {
      openrouter: 'https://openrouter.ai/api/v1',
      deepseek: 'https://api.deepseek.com/v1',
    }
    return urls[this.name] ?? ''
  }

  async execute(req: AIRequest): Promise<AIResponse> {
    const res = await this.httpPost('/chat/completions', {
      model: req.model,
      messages: req.input.messages,
      stream: false,
    })

    if (!res.ok) {
      const err = await res.json()
      return { id: '', status: 'failed', error: err.error?.message }
    }

    const data = await res.json()
    return {
      id: data.id,
      status: 'completed',
      output: { content: data.choices[0].message.content },
    }
  }

  async *executeStream(req: AIRequest): AsyncGenerator<AIStreamChunk> {
    const res = await this.httpPost('/chat/completions', {
      model: req.model,
      messages: req.input.messages,
      stream: true,
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') {
          yield { type: 'complete', data: null }
          return
        }
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) yield { type: 'text_delta', data: delta }
      }
    }
  }
}
```

### 3.3 Google Gemini

```typescript
// apps/worker/src/services/ai-providers/gemini.ts

export class GeminiProvider extends BaseAIProvider {
  name: ProviderName = 'gemini'
  category: TaskCategory = 'text'
  executionMode: ExecutionMode = 'sync'

  protected defaultBaseUrl() {
    return 'https://generativelanguage.googleapis.com/v1beta'
  }

  protected authHeaders() {
    return {} // Gemini 用 query param
  }

  async execute(req: AIRequest): Promise<AIResponse> {
    const res = await fetch(
      `${this.baseUrl}/models/${req.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: this.convertMessages(req.input.messages as any[]),
        }),
      },
    )

    const data = await res.json()
    if (data.error) {
      return { id: '', status: 'failed', error: data.error.message }
    }

    return {
      id: '',
      status: 'completed',
      output: {
        content: data.candidates[0].content.parts[0].text,
      },
    }
  }

  private convertMessages(messages: Array<{ role: string; content: string }>) {
    return messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
  }
}
```

### 3.4 异步 Provider（Kling 示例）

```typescript
// apps/worker/src/services/ai-providers/kling.ts

export class KlingProvider extends BaseAIProvider {
  name: ProviderName = 'kling'
  category: TaskCategory = 'video'
  executionMode: ExecutionMode = 'async'

  protected defaultBaseUrl() {
    return 'https://api.klingai.com/v1'
  }

  async execute(req: AIRequest): Promise<AIResponse> {
    const res = await this.httpPost('/videos/generations', {
      model: req.model,
      prompt: req.input.prompt,
      duration: req.input.duration ?? 5,
      aspect_ratio: req.input.aspect_ratio ?? '16:9',
      ...(req.input.image_url && {
        image: req.input.image_url,
        mode: 'image_to_video',
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { id: '', status: 'failed', error: err.message }
    }

    const data = await res.json()
    return {
      id: data.data.task_id,
      status: 'pending',
      output: { external_task_id: data.data.task_id },
    }
  }

  async checkTaskStatus(externalTaskId: string): Promise<AIResponse> {
    const res = await fetch(`${this.baseUrl}/videos/generations/${externalTaskId}`, {
      headers: this.authHeaders(),
    })

    const data = await res.json()
    const task = data.data

    switch (task.task_status) {
      case 'submitted':
      case 'processing':
        return {
          id: externalTaskId,
          status: 'pending',
          output: { progress: task.task_status_msg ?? 0 },
        }
      case 'succeed':
        return {
          id: externalTaskId,
          status: 'completed',
          output: {
            video_url: task.task_result.videos[0].url,
            duration: task.task_result.videos[0].duration,
          },
        }
      case 'failed':
        return {
          id: externalTaskId,
          status: 'failed',
          error: task.task_status_msg,
        }
      default:
        return { id: externalTaskId, status: 'pending' }
    }
  }
}
```

### 3.5 音频 Provider（ElevenLabs）

```typescript
// apps/worker/src/services/ai-providers/elevenlabs.ts

export class ElevenLabsProvider extends BaseAIProvider {
  name: ProviderName = 'elevenlabs'
  category: TaskCategory = 'audio'
  executionMode: ExecutionMode = 'sync'

  protected defaultBaseUrl() {
    return 'https://api.elevenlabs.io/v1'
  }

  protected authHeaders() {
    return { 'xi-api-key': this.apiKey }
  }

  async execute(req: AIRequest): Promise<AIResponse> {
    const voiceId = (req.input.voice_id as string) ?? 'default'
    const res = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: req.input.text,
        model_id: req.model,
      }),
    })

    if (!res.ok) {
      return { id: '', status: 'failed', error: 'TTS generation failed' }
    }

    // 返回音频二进制，上层需写入 R2
    return {
      id: crypto.randomUUID(),
      status: 'completed',
      output: {
        audio_stream: res.body,
        content_type: 'audio/mpeg',
      },
    }
  }
}
```

---

## 四、Provider 工厂与注册

```typescript
// apps/worker/src/services/ai-providers/registry.ts

const providers = new Map<ProviderName, new (config: AIProviderConfig) => AIProvider>()

export function registerProvider(
  name: ProviderName,
  ctor: new (config: AIProviderConfig) => AIProvider,
) {
  providers.set(name, ctor)
}

export function createProvider(name: ProviderName, apiKey: string): AIProvider {
  const Ctor = providers.get(name)
  if (!Ctor) throw new Error(`Unknown provider: ${name}`)
  return new Ctor({ provider: name, apiKey })
}

// 初始化注册
registerProvider('openrouter', (c) => new OpenAICompatibleProvider('openrouter', c))
registerProvider('deepseek', (c) => new OpenAICompatibleProvider('deepseek', c))
registerProvider('gemini', GeminiProvider)
registerProvider('kling', KlingProvider)
registerProvider('elevenlabs', ElevenLabsProvider)
// runway, sora, flux, stable-diffusion ... 后续按需添加
```

---

## 五、与异步任务队列的集成

### 5.1 任务处理器调用 Provider

```
用户提交视频生成请求
    │
    ▼
Next.js Route Handler
    │ 1. 验证积分余额
    │ 2. 冻结积分
    │ 3. 创建 async_task 记录（status=pending）
    │ 4. 发送消息到 Cloudflare Queue
    ▼
Cloudflare Queue Consumer (Worker)
    │ 1. 从 async_tasks 读取任务详情
    │ 2. createProvider(task.provider, env[API_KEY])
    │ 3. provider.execute(request)
    │     → 对于异步 Provider：拿到 external_task_id
    │ 4. 更新 async_tasks.external_task_id
    │ 5. 进入轮询循环（或 re-enqueue 延迟消息）
    ▼
轮询阶段
    │ 1. provider.checkTaskStatus(external_task_id)
    │ 2. status === 'pending' → re-enqueue（延迟 5-10s）
    │ 3. status === 'completed' → 下载到 R2 → 更新任务
    │ 4. status === 'failed' → 退还积分 → 更新任务
    ▼
前端获取结果
    │ 轮询 GET /api/tasks/:id
    │ 或 SSE 推送（P2）
    ▼
画布节点显示结果
```

### 5.2 轮询策略

| Provider | 轮询间隔                   | 最大等待 | 重试次数 |
| -------- | -------------------------- | -------- | -------- |
| Kling    | 5s → 10s → 15s（指数退避） | 10min    | 3        |
| Runway   | WS 推送（无需轮询）        | 5min     | 2        |
| Sora     | 10s → 20s → 30s            | 15min    | 3        |
| FLUX     | 3s → 5s → 8s               | 2min     | 3        |

### 5.3 结果存储流程

```typescript
async function handleTaskCompletion(task: AsyncTask, result: AIResponse, env: Env) {
  const { output } = result

  // 异步 Provider 返回的是外部 URL，需要下载到 R2
  if (output?.video_url || output?.image_url) {
    const url = (output.video_url ?? output.image_url) as string
    const ext = url.includes('.mp4') ? 'mp4' : 'png'
    const r2Key = `outputs/${task.user_id}/${task.id}.${ext}`

    // 流式下载到 R2
    const res = await fetch(url)
    await env.BUCKET.put(r2Key, res.body, {
      httpMetadata: { contentType: res.headers.get('content-type') ?? '' },
    })

    // 更新任务
    await updateTask(env.DB, task.id, {
      status: 'completed',
      output_data: JSON.stringify({ r2_key: r2Key }),
      completed_at: Date.now(),
    })
  }

  // 音频 Provider 返回的是 stream
  if (output?.audio_stream) {
    const r2Key = `outputs/${task.user_id}/${task.id}.mp3`
    await env.BUCKET.put(r2Key, output.audio_stream as ReadableStream, {
      httpMetadata: { contentType: 'audio/mpeg' },
    })

    await updateTask(env.DB, task.id, {
      status: 'completed',
      output_data: JSON.stringify({ r2_key: r2Key }),
      completed_at: Date.now(),
    })
  }

  // 确认积分扣费
  await confirmCreditDeduction(env.DB, task.user_id, task.credits_charged)
}
```

---

## 六、错误处理策略

| 错误类型     | HTTP Code | 处理                  | 积分     |
| ------------ | --------- | --------------------- | -------- |
| 余额不足     | 402       | 前端提示充值          | 不冻结   |
| API Key 无效 | 401       | 清除缓存的 Key 状态   | 退还     |
| 模型不可用   | 503       | 重试 1 次，失败则报错 | 退还     |
| 速率限制     | 429       | 指数退避重试          | 保持冻结 |
| 内容违规     | 400       | 返回具体违规原因      | 退还     |
| 生成超时     | 408/504   | 异步任务标记失败      | 退还     |
| 未知错误     | 500       | 记录日志，通知 Sentry | 退还     |

---

## 七、新增 Provider 检查清单

添加新的 AI Provider 时，必须完成以下步骤：

- [ ] 实现 `AIProvider` 接口
- [ ] 注册到 `registry.ts`
- [ ] 在 `model_pricing` 表中添加定价配置
- [ ] 在 `wrangler.toml` 中添加 API Key 环境变量
- [ ] 如果是异步 Provider，实现 `checkTaskStatus`
- [ ] 如果需要轮询，配置轮询策略参数
- [ ] 编写单元测试（mock API 响应）
- [ ] 更新前端模型选择器的模型列表

---

## 八、更新日志

| 日期       | 版本 | 变更内容                                                                           |
| ---------- | ---- | ---------------------------------------------------------------------------------- |
| 2026-03-04 | v1.0 | 初始版本：统一接口设计、各 Provider SDK 差异分析、实现示例、异步任务集成、错误处理 |

---

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
