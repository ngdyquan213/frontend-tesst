import { Link } from 'react-router-dom'
import type { Booking } from '@/shared/types/common'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { CurrencyText } from '@/shared/components/CurrencyText'
import { Table } from '@/shared/ui/Table'

interface BookingManagementTableProps {
  bookings?: Booking[]
  isPending?: boolean
  errorMessage?: string
}

export const BookingManagementTable = ({
  bookings,
  isPending = false,
  errorMessage,
}: BookingManagementTableProps) => {
  if (isPending) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    )
  }

  if (errorMessage) {
    return <Alert tone="danger">{errorMessage}</Alert>
  }

  if (!bookings || bookings.length === 0) {
    return (
      <EmptyState
        title="No bookings found"
        description="Bookings that match the current page will appear here."
      />
    )
  }

  return (
    <Table columns={['Reference', 'Status', 'Total']}>
      {bookings.map((booking) => (
        <tr key={booking.id}>
          <td className="px-6 py-4 font-semibold text-primary">{booking.reference}</td>
          <td className="px-6 py-4 text-on-surface-variant">{booking.status}</td>
          <td className="px-6 py-4 text-on-surface-variant">
            <CurrencyText value={booking.total} currency={booking.currency} />
          </td>
          <td className="px-6 py-4 text-right text-sm font-semibold">
            <Link
              to={`/admin/bookings/${booking.id}`}
              className="text-secondary transition hover:text-primary"
            >
              Review details
            </Link>
          </td>
        </tr>
      ))}
    </Table>
  )
}
