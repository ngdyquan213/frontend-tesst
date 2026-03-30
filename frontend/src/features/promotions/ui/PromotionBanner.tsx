import { usePromotionsQuery } from '@/features/promotions/queries/usePromotionsQuery'
import { Alert } from '@/shared/ui/Alert'

export const PromotionBanner = () => {
  const { data } = usePromotionsQuery()
  const promotion = data?.[0]
  if (!promotion) return null
  return <Alert tone="success">{promotion.title}: {promotion.discountLabel} with code {promotion.code}</Alert>
}

