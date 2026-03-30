import { resolveAfter } from '@/shared/api/apiClient'
import { pricingRules } from '@/shared/api/mockData'

export const adminPricingApi = {
  getPricing: () => resolveAfter(pricingRules),
  updatePricingRule: async () => resolveAfter(pricingRules[0]),
}

