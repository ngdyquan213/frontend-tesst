import { resolveAfter } from '@/shared/api/apiClient'
import { promotions } from '@/shared/api/mockData'

export const promotionsApi = {
  getPromotions: () => resolveAfter(promotions),
}

