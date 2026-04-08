import type { Booking } from '@/shared/types/common'
import { Card } from '@/shared/ui/Card'
import { CurrencyText } from '@/shared/components/CurrencyText'

export const BookingSummary = ({ booking }: { booking: Booking }) => (
  <Card className="space-y-3">
    <div className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Booking summary</div>
    <div className="flex items-center justify-between">
      <span className="text-on-surface-variant">Reference</span>
      <span className="font-semibold text-primary">{booking.reference}</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-on-surface-variant">Total</span>
      <span className="font-extrabold text-primary">
        <CurrencyText value={booking.total} currency={booking.currency} />
      </span>
    </div>
  </Card>
)
