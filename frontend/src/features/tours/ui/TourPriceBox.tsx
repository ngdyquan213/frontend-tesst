import { Link } from 'react-router-dom'
import type { Tour } from '@/shared/types/common'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { CurrencyText } from '@/shared/components/CurrencyText'

export const TourPriceBox = ({ tour }: { tour: Tour }) => (
  <Card className="sticky top-24 text-center">
    <div className="mb-3 text-sm uppercase tracking-widest text-on-surface-variant">Price</div>
    <div className="mb-2 text-3xl font-extrabold text-primary">
      <CurrencyText value={tour.priceFrom} />
    </div>
    <p className="mb-6 text-sm text-on-surface-variant">Secure your preferred departure with verified availability.</p>
    <Button className="w-full">
      <Link className="w-full" to={`/tours/${tour.slug}/schedules`}>
        View schedules
      </Link>
    </Button>
  </Card>
)
