import { useParams } from 'react-router-dom'
import { useBookingDetailQuery } from '@/features/bookings/queries/useBookingDetailQuery'
import { BookingActions } from '@/features/bookings/ui/BookingActions'
import { BookingSummary } from '@/features/bookings/ui/BookingSummary'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

const BookingDetailPage = () => {
  const { bookingId } = useParams()
  const { data, isPending, isError, error } = useBookingDetailQuery(bookingId)

  if (!bookingId) {
    return (
      <EmptyState
        title="Booking unavailable"
        description="We could not determine which booking you wanted to open."
      />
    )
  }

  if (isPending) {
    return (
      <div className="space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Booking unavailable"
        description={error?.message || 'We could not load this booking right now.'}
      />
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader title={data.reference} description={data.notes} />
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <BookingSummary booking={data} />
        <div className="self-start">
          <BookingActions bookingId={data.id} />
        </div>
      </div>
    </div>
  )
}

export default BookingDetailPage
