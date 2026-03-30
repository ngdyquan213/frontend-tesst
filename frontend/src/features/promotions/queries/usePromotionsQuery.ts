import { useQuery } from '@tanstack/react-query'
import { promotionsApi } from '@/features/promotions/api/promotions.api'
import { promotionKeys } from '@/features/promotions/queries/promotionKeys'

export const usePromotionsQuery = () =>
  useQuery({
    queryKey: promotionKeys.list(),
    queryFn: promotionsApi.getPromotions,
  })

