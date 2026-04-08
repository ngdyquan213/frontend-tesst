import { Link } from 'react-router-dom'
import type { Booking } from '@/shared/types/common'
import { Card } from '@/shared/ui/Card'
import { CurrencyText } from '@/shared/components/CurrencyText'

export const BookingCard = ({ booking }: { booking: Booking }) => (
  <Card className="space-y-4">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{booking.reference}</div>
        <div className="mt-2 text-xl font-bold text-primary">{booking.status}</div>
      </div>
      <div className="text-right">
        <div className="text-xs uppercase tracking-widest text-on-surface-variant">Total</div>
        <div className="text-xl font-extrabold text-primary">
          <CurrencyText value={booking.total} currency={booking.currency} />
        </div>
      </div>
    </div>
    <p className="text-sm text-on-surface-variant">{booking.notes}</p>
    <Link
      className="inline-flex items-center justify-center rounded-xl border border-[color:var(--color-outline)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary)] transition-all duration-300 hover:bg-[color:var(--color-surface-low)]"
      to={`/account/bookings/${booking.id}`}
    >
      View detail
    </Link>
  </Card>
)
