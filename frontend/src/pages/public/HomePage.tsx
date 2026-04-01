import { FeaturedToursSection } from '@/widgets/home/FeaturedToursSection'
import { FinalCtaSection } from '@/widgets/home/FinalCtaSection'
import { HeroSection } from '@/widgets/home/HeroSection'
import { PopularDestinationsSection } from '@/widgets/home/PopularDestinationsSection'
import { PromotionSection } from '@/widgets/home/PromotionSection'
import { HowItWorksSection } from '@/widgets/home/HowItWorksSection'
import { BookingConfidenceSection } from '@/widgets/home/BookingConfidenceSection'
import { TestimonialsSection } from '@/widgets/home/TestimonialsSection'
import { TrustStrip } from '@/widgets/home/TrustStrip'

const HomePage = () => (
  <>
    <HeroSection />
    <TrustStrip />
    <FeaturedToursSection />
    <PopularDestinationsSection />

    <PromotionSection />
    <HowItWorksSection />
    <BookingConfidenceSection />
    <TestimonialsSection />
    <FinalCtaSection />
    {/* <PromotionSection /> */}
  </>
)

export default HomePage

