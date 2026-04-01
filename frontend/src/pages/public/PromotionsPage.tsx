import { PromotionBannerSection } from '@/widgets/promotions/PromotionBanner'
import { PromotionCatalogSection } from '@/widgets/promotions/PromotionCatalog'
import { PromotionHeroSection } from '@/widgets/promotions/PromotionHero'

export function PromotionsPage() {
  return (
    <>
      <PromotionHeroSection />
      <PromotionBannerSection />
      <PromotionCatalogSection />
    </>
  )
}
