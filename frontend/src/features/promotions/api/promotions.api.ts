import type { Promotion, PromotionQueryParams } from '@/features/promotions/model/promotion.types'
import { apiClient } from '@/shared/api/apiClient'

export async function getPromotions(
  params: PromotionQueryParams = {},
  _signal?: AbortSignal,
): Promise<Promotion[]> {
  void _signal
  return apiClient.getPromotions(params)
}

export async function getPromotionById(id: string, _signal?: AbortSignal): Promise<Promotion> {
  void _signal
  const promotions = await apiClient.getPromotions()
  const promotion = promotions.find((entry) => entry.id === id)

  if (!promotion) {
    throw new Error('Promotion not found.')
  }

  return promotion
}

export const promotionsApi = {
  getPromotions,
  getPromotionById,
}
