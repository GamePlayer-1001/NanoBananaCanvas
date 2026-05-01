/**
 * [INPUT]: 依赖 vitest，依赖 workflow history/agent audit/replay 路由，mock 认证与 D1
 * [OUTPUT]: 对外提供 workflow 子路由回归测试，覆盖 Agent 审计记录与最近回放读取
 * [POS]: app/api/workflows/[id] 的 API 闭环测试，保护 M12 审计/回放能力
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/auth', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

vi.mock('@/lib/nanoid', () => ({
  nanoid: vi.fn(() => 'audit-seed'),
}))

import { requireAuth } from '@/lib/api/auth'
import { getDb } from '@/lib/db'

import { GET as agentReplayGet } from './agent-replay/route'
import { GET as agentAuditGet, POST as agentAuditPost } from './agent-audit/route'

function createDbMock() {
  return {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn(() => ({
        first: vi.fn(async () => {
          if (sql.includes('SELECT id FROM workflows')) {
            return { id: 'wf-1' }
          }
          if (sql.includes("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")) {
            return { name: 'agent_audit_logs' }
          }
          if (sql.includes('FROM agent_audit_logs') && sql.includes('LIMIT 1')) {
            return {
              id: 'audit-1',
              event_type: 'plan_applied',
              proposal_id: 'plan-1',
              replay_snapshot: JSON.stringify({
                focusNodeIds: ['image-1'],
                changeSummary: '最近一次 Agent 已把主图节点替换成更省钱的模型。',
              }),
              plan_json: JSON.stringify({ id: 'plan-1', summary: 'replace model' }),
              result_json: JSON.stringify({ ok: true }),
              created_at: '2026-04-30T00:00:00.000Z',
            }
          }
          return null
        }),
        all: vi.fn(async () => ({
          results: [
            {
              id: 'audit-1',
              event_type: 'plan_generated',
              mode: 'update',
              user_message: '帮我改便宜一点',
              canvas_summary: JSON.stringify({ workflowId: 'wf-1' }),
              plan_json: JSON.stringify({ id: 'plan-1', summary: 'replace model' }),
              alternatives_json: JSON.stringify([{ id: 'plan-2', summary: 'higher quality' }]),
              result_json: null,
              replay_snapshot: JSON.stringify({ changeSummary: '最近一次 Agent 改了主图节点。' }),
              target_node_id: 'image-1',
              proposal_id: 'plan-1',
              confirmed: 0,
              metadata_json: JSON.stringify({ alternativeCount: 1 }),
              created_at: '2026-04-30T00:00:00.000Z',
            },
          ],
        })),
        run: vi.fn(async () => ({ success: true })),
      })),
    })),
  }
}

describe('POST/GET /api/workflows/[id]/agent-*', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue({ userId: 'user-1' } as never)
    vi.mocked(getDb).mockResolvedValue(createDbMock() as never)
  })

  it('records agent audit logs for a workflow', async () => {
    const response = await agentAuditPost(
      new Request('http://localhost/api/workflows/wf-1/agent-audit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventType: 'plan_generated',
          mode: 'update',
          userMessage: '帮我改便宜一点',
          proposalId: 'plan-1',
        }),
      }) as never,
      { params: Promise.resolve({ id: 'wf-1' }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        recorded: true,
        id: 'audit-seed',
      },
    })
  })

  it('returns latest workflow agent audit logs', async () => {
    const response = await agentAuditGet(
      new Request('http://localhost/api/workflows/wf-1/agent-audit') as never,
      { params: Promise.resolve({ id: 'wf-1' }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: [
        expect.objectContaining({
          id: 'audit-1',
          eventType: 'plan_generated',
          proposalId: 'plan-1',
        }),
      ],
    })
  })

  it('returns latest agent replay snapshot for a workflow', async () => {
    const response = await agentReplayGet(
      new Request('http://localhost/api/workflows/wf-1/agent-replay') as never,
      { params: Promise.resolve({ id: 'wf-1' }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        replay: expect.objectContaining({
          id: 'audit-1',
          proposalId: 'plan-1',
          replaySnapshot: expect.objectContaining({
            focusNodeIds: ['image-1'],
          }),
        }),
      },
    })
  })

  it('returns replay null when the audit table is missing', async () => {
    vi.mocked(getDb).mockResolvedValue({
      prepare: vi.fn((sql: string) => ({
        bind: vi.fn((...args: unknown[]) => ({
          first: vi.fn(async () => {
            if (sql.includes('SELECT id FROM workflows')) {
              return { id: 'wf-1' }
            }

            if (sql.includes("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")) {
              return null
            }

            throw new Error(`unexpected first query: ${sql} :: ${args.join(',')}`)
          }),
        })),
      })),
    } as never)

    const response = await agentReplayGet(
      new Request('http://localhost/api/workflows/wf-1/agent-replay') as never,
      { params: Promise.resolve({ id: 'wf-1' }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        replay: null,
      },
    })
  })
})
