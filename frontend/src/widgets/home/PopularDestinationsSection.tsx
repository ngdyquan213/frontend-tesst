import { DestinationSection } from '@/features/tours/ui/DestinationSection'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const PopularDestinationsSection = () => (
  <section className="page-shell py-20">
    <SectionHeader title="Popular Destinations" description="Destinations mapped from your approved final screens." />
    <DestinationSection />
  </section>
)

