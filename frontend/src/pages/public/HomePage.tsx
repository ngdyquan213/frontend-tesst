import { FeaturedToursSection } from '@/widgets/home/FeaturedToursSection'
import { FinalCtaSection } from '@/widgets/home/FinalCtaSection'
import { HeroSection } from '@/widgets/home/HeroSection'
import { PopularDestinationsSection } from '@/widgets/home/PopularDestinationsSection'
import { PromotionSection } from '@/widgets/home/PromotionSection'
import { TestimonialsSection } from '@/widgets/home/TestimonialsSection'
import { TrustStrip } from '@/widgets/home/TrustStrip'

const HomePage = () => (
  <>
    <HeroSection />
    <TrustStrip />
    <FeaturedToursSection />
    <PopularDestinationsSection />

    <TestimonialsSection />
    <FinalCtaSection />
    {/* <PromotionSection /> */}
  </>
)

export default HomePage

