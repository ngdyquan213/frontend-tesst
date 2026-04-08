import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminPricingApi } from '@/features/admin/pricing/api/adminPricing.api'
import { adminPricingKeys } from '@/features/admin/pricing/queries/adminPricingKeys'

export const useUpdatePricingRuleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminPricingApi.updatePricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPricingKeys.all })
    },
  })
}
