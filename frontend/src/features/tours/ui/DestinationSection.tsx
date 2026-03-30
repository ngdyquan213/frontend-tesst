import { destinations } from '@/shared/api/mockData'
import { Card } from '@/shared/ui/Card'

export const DestinationSection = () => (
  <div className="grid gap-6 md:grid-cols-3">
    {destinations.map((destination) => (
      <Card key={destination.id} className="overflow-hidden p-0">
        <img alt={destination.name} className="h-52 w-full object-cover" src={destination.image} />
        <div className="space-y-3 p-6">
          <h3 className="text-xl font-bold text-primary">{destination.name}</h3>
          <p className="text-sm text-on-surface-variant">{destination.summary}</p>
        </div>
      </Card>
    ))}
  </div>
)

