/**
 * [INPUT]: 依赖 vitest，依赖 ./server-assistant 与平台 runtime / provider mock
 * [OUTPUT]: 对外提供 server-assistant 的回归测试，覆盖文本与多模态用户消息构造
 * [POS]: lib/agent 的服务端助手测试，保护参考图解析与结构化 JSON 调用不会丢图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const chatMock = vi.fn()

vi.mock('@/lib/platform-runtime', () => ({
  resolvePlatformRuntimeModel: vi.fn(() => ({
    supplierId: 'openrouter',
    modelId: 'gpt-4.1-mini',
  })),
}))

vi.mock('@/services/ai', () => ({
  createPlatformTextProvider: vi.fn(() => ({
    chat: chatMock,
  })),
  getPlatformSupplierApiKey: vi.fn(async () => 'platform-key'),
}))

import { callAgentAssistantText } from './server-assistant'

describe('server-assistant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chatMock.mockResolvedValue({
      content: '{"ok":true}',
    })
  })

  it('sends plain text content when no reference image is provided', async () => {
    await callAgentAssistantText({
      prompt: '只做文本推理',
    })

    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: '只做文本推理',
          }),
        ]),
      }),
    )
  })

  it('sends multimodal content parts when reference images are provided', async () => {
    await callAgentAssistantText({
      prompt: '请理解这张参考工作流图',
      imageUrls: ['https://example.com/workflow-reference.png'],
    })

    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: [
              { type: 'text', text: '请理解这张参考工作流图' },
              { type: 'image_url', image_url: { url: 'https://example.com/workflow-reference.png' } },
            ],
          }),
        ]),
      }),
    )
  })
})
