import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buildTourDetailPath, routePaths } from '@/app/router/routePaths'
import { useToursQuery } from '@/features/tours/queries/useToursQuery'
import { TourCard } from '@/features/tours/ui/TourCard'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const FeaturedToursSection = () => {
  const { data } = useToursQuery()
  return (
    <section className="page-shell py-20">
      <SectionHeader
        title="Featured Experiences"
        subtitle="Our most sought-after journeys this season."
        action={
          <Link
            to={routePaths.public.tours}
            className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--color-secondary-strong)] transition-all hover:gap-3"
          >
            View all tours
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-8 md:grid-cols-3">
        {data?.slice(0, 3).map((tour) => (
          <TourCard key={tour.id} tour={tour} href={buildTourDetailPath(tour.id)} />
        ))}
      </div>
    </section>
  )
}
