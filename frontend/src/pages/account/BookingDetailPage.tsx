import { useParams } from 'react-router-dom'
import { useBookingDetailQuery } from '@/features/bookings/queries/useBookingDetailQuery'
import { BookingActions } from '@/features/bookings/ui/BookingActions'
import { BookingSummary } from '@/features/bookings/ui/BookingSummary'
import { PageHeader } from '@/shared/components/PageHeader'

const BookingDetailPage = () => {
  const { bookingId = 'booking-1' } = useParams()
  const { data } = useBookingDetailQuery(bookingId)
  if (!data) return null

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

