export const createQueryKeys = (scope: string) => ({
  all: [scope] as const,
  list: (filters?: unknown) => [scope, 'list', filters] as const,
  detail: (id: string) => [scope, 'detail', id] as const,
})

