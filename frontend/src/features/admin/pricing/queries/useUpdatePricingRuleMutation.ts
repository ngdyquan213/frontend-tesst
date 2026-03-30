import { useMutation } from '@tanstack/react-query'
import { adminPricingApi } from '@/features/admin/pricing/api/adminPricing.api'

export const useUpdatePricingRuleMutation = () =>
  useMutation({
    mutationFn: adminPricingApi.updatePricingRule,
  })

