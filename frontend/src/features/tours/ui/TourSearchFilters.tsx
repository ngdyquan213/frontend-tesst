import { FormField } from '@/shared/forms/FormField'
import { FilterPanel } from '@/shared/components/FilterPanel'
import { SearchBar } from '@/shared/components/SearchBar'
import { QuantityField } from '@/shared/forms/QuantityField'

interface TourSearchFiltersProps {
  search: string
  travelers: number
  onSearchChange: (value: string) => void
  onTravelersChange: (value: number) => void
}

export const TourSearchFilters = ({
  search,
  travelers,
  onSearchChange,
  onTravelersChange,
}: TourSearchFiltersProps) => (
  <FilterPanel>
    <div className="flex-1">
      <FormField label="Destination">
        <SearchBar placeholder="Where to next?" value={search} onChange={onSearchChange} />
      </FormField>
    </div>
    <div className="w-full md:w-52">
      <FormField label="Travelers">
        <QuantityField value={travelers} onChange={onTravelersChange} />
      </FormField>
    </div>
  </FilterPanel>
)

