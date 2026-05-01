/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 queryKeys 工厂函数
 * [POS]: lib/query 的缓存键注册中心，被所有 query hooks 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const queryKeys = {
  workflows: {
    all: ['workflows'] as const,
    list: (filters?: object) =>
      [...queryKeys.workflows.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.workflows.all, 'detail', id] as const,
  },
  folders: {
    all: ['folders'] as const,
    list: () => [...queryKeys.folders.all, 'list'] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
  },
  billing: {
    all: ['billing'] as const,
    balance: () => [...queryKeys.billing.all, 'balance'] as const,
    signinStatus: () => [...queryKeys.billing.all, 'signin-status'] as const,
  },
  explore: {
    all: ['explore'] as const,
    list: (filters?: object) =>
      [...queryKeys.explore.all, 'list', filters] as const,
    search: (q: string, page?: number) =>
      [...queryKeys.explore.all, 'search', q, page] as const,
    detail: (id: string) => [...queryKeys.explore.all, 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (locale?: string) => [...queryKeys.categories.all, 'list', locale] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (page?: number) => [...queryKeys.notifications.all, 'list', page] as const,
  },
  ai: {
    all: ['ai'] as const,
    models: (category?: string) => [...queryKeys.ai.all, 'models', category] as const,
  },
  settings: {
    all: ['settings'] as const,
    apiKeys: () => [...queryKeys.settings.all, 'api-keys'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (filters?: object) => [...queryKeys.tasks.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
  },
} as const
