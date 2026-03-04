/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 queryKeys 工厂函数
 * [POS]: lib/query 的缓存键注册中心，被所有 query hooks 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const queryKeys = {
  workflows: {
    all: ['workflows'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.workflows.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.workflows.all, 'detail', id] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    credits: () => [...queryKeys.user.all, 'credits'] as const,
  },
} as const
