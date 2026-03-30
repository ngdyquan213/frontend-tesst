import { useToursQuery } from '@/features/tours/queries/useToursQuery'
import { TourCard } from '@/features/tours/ui/TourCard'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const FeaturedToursSection = () => {
  const { data } = useToursQuery()
  return (
    <section className="page-shell py-20">
      <SectionHeader title="Featured Tours" description="Carefully planned itineraries for your next adventure." />
      <div className="grid gap-8 md:grid-cols-3">
        {data?.slice(0, 3).map((tour) => <TourCard key={tour.id} tour={tour} />)}
      </div>
    </section>
  )
}

