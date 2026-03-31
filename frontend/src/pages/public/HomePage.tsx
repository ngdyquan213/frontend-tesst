import { FeaturedToursSection } from '@/widgets/home/FeaturedToursSection'
import { HeroSection } from '@/widgets/home/HeroSection'
import { PopularDestinationsSection } from '@/widgets/home/PopularDestinationsSection'
import { PromotionSection } from '@/widgets/home/PromotionSection'
import { TrustStrip } from '@/widgets/home/TrustStrip'

const HomePage = () => (
  <>
    <HeroSection />
    <TrustStrip />
    <FeaturedToursSection />
    <PopularDestinationsSection />
    <PromotionSection />
  </>
)

export default HomePage

