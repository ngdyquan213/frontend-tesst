import { useParams } from 'react-router-dom'
import { PageHeader } from '@/shared/components/PageHeader'
import { BookingSummary } from '@/features/bookings/ui/BookingSummary'
import { useBookingDetailQuery } from '@/features/bookings/queries/useBookingDetailQuery'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

const BookingDetailPage = () => {
  const { bookingId } = useParams()
  const { data, isPending, isError, error } = useBookingDetailQuery(bookingId)

  if (!bookingId) {
    return (
      <EmptyState
        title="Booking unavailable"
        description="We could not determine which admin booking record you wanted to review."
      />
    )
  }

  if (isPending) {
    return (
      <div className="space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-72" />
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
      <PageHeader title={`Admin review ${data.reference}`} description={data.notes} />
      <BookingSummary booking={data} />
    </div>
  )
}

export default BookingDetailPage
