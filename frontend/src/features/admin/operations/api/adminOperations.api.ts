import { resolveAfter } from '@/shared/api/apiClient'
import { adminTasks } from '@/shared/api/mockData'

export const adminOperationsApi = {
  getOperations: () => resolveAfter(adminTasks),
}

