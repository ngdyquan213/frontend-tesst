import { usePromotionsQuery } from '@/features/promotions/queries/usePromotionsQuery'
import { PromotionCard } from '@/features/promotions/ui/PromotionCard'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const PromotionSection = () => {
  const { data } = usePromotionsQuery()
  return (
    <section className="page-shell py-20">
      <SectionHeader
        title="Promotions"
        subtitle="Offers kept visually close to the static references."
      />
      <div className="grid gap-8 md:grid-cols-2">
        {data?.map((promotion) => <PromotionCard key={promotion.id} promotion={promotion} />)}
      </div>
    </section>
  )
}
