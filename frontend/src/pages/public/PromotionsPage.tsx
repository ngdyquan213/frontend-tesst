import { usePromotionsQuery } from '@/features/promotions/queries/usePromotionsQuery'
import { PromotionBanner } from '@/features/promotions/ui/PromotionBanner'
import { PromotionCard } from '@/features/promotions/ui/PromotionCard'
import { PageHeader } from '@/shared/components/PageHeader'

const PromotionsPage = () => {
  const { data } = usePromotionsQuery()
  return (
    <div className="page-shell space-y-10 py-12">
      <PageHeader title="Promotions" description="Offer modules remain close to the approved static references." />
      <PromotionBanner />
      <div className="grid gap-8 md:grid-cols-2">
        {data?.map((promotion) => <PromotionCard key={promotion.id} promotion={promotion} />)}
      </div>
    </div>
  )
}

export default PromotionsPage

