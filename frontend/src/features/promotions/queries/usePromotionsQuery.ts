import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getPromotions } from '@/features/promotions/api/promotions.api'
import type { Promotion, PromotionQueryParams } from '@/features/promotions/model/promotion.types'
import { promotionKeys } from '@/features/promotions/queries/promotionKeys'

export function usePromotionsQuery(params: PromotionQueryParams = {}) {
  return useQuery<Promotion[], Error>({
    queryKey: promotionKeys.list(params),
    queryFn: ({ signal }) => getPromotions(params, signal),
    placeholderData: keepPreviousData,
  })
}
