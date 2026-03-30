import { useQuery } from '@tanstack/react-query'
import { adminPricingApi } from '@/features/admin/pricing/api/adminPricing.api'
import { adminPricingKeys } from '@/features/admin/pricing/queries/adminPricingKeys'

export const useAdminPricingQuery = () =>
  useQuery({
    queryKey: adminPricingKeys.list(),
    queryFn: adminPricingApi.getPricing,
  })

