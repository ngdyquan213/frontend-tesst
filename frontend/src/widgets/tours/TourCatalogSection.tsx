import { useState } from 'react'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useToursQuery } from '@/features/tours/queries/useToursQuery'
import { TourCard } from '@/features/tours/ui/TourCard'
import { TourSearchFilters } from '@/features/tours/ui/TourSearchFilters'

export const TourCatalogSection = () => {
  const [search, setSearch] = useState('')
  const [travelers, setTravelers] = useState(2)
  const debouncedSearch = useDebounce(search)
  const { data } = useToursQuery(debouncedSearch)

  return (
    <section className="space-y-8">
      <TourSearchFilters
        onSearchChange={setSearch}
        onTravelersChange={setTravelers}
        search={search}
        travelers={travelers}
      />
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((tour) => (
          <TourCard key={tour.id} tour={tour} variant="catalog" />
        ))}
      </div>
    </section>
  )
}
