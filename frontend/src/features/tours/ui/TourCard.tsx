import { Link } from 'react-router-dom'
import type { Tour } from '@/shared/types/common'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { CurrencyText } from '@/shared/components/CurrencyText'

export const TourCard = ({ tour }: { tour: Tour }) => (
  <Card className="overflow-hidden p-0">
    <div className="h-64 overflow-hidden">
      <img alt={tour.title} className="h-full w-full object-cover transition duration-700 hover:scale-105" src={tour.cardImage} />
    </div>
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          {tour.badge ? <Badge tone="info">{tour.badge}</Badge> : null}
          <h3 className="mt-3 text-2xl font-bold text-primary">{tour.title}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{tour.summary}</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">From</div>
          <div className="text-2xl font-extrabold text-secondary">
            <CurrencyText value={tour.priceFrom} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm text-on-surface-variant">
        <span>{tour.durationDays} days</span>
        <span>Max {tour.groupSize}</span>
      </div>
      <Button className="w-full" variant="outline">
        <Link className="w-full" to={`/tours/${tour.slug}`}>
          View itinerary
        </Link>
      </Button>
    </div>
  </Card>
)

