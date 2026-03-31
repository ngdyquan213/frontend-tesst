import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useToursQuery } from '@/features/tours/queries/useToursQuery'
import { TourCard } from '@/features/tours/ui/TourCard'
import { TourSearchFilters } from '@/features/tours/ui/TourSearchFilters'

export const TourCatalogSection = () => {
  const [searchParams] = useSearchParams()
  const destinationSearch = searchParams.get('destination') ?? ''
  const [search, setSearch] = useState(destinationSearch)
  const [travelers, setTravelers] = useState(2)
  const debouncedSearch = useDebounce(search)
  const { data } = useToursQuery(debouncedSearch)

  useEffect(() => {
    setSearch(destinationSearch)
  }, [destinationSearch])

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
