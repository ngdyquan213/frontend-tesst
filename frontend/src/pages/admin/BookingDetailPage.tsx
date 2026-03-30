import { PageHeader } from '@/shared/components/PageHeader'
import { BookingSummary } from '@/features/bookings/ui/BookingSummary'
import { useBookingDetailQuery } from '@/features/bookings/queries/useBookingDetailQuery'

const BookingDetailPage = () => {
  const { data } = useBookingDetailQuery('booking-1')
  if (!data) return null
  return (
    <div className="space-y-10">
      <PageHeader title={`Admin review ${data.reference}`} description={data.notes} />
      <BookingSummary booking={data} />
    </div>
  )
}

export default BookingDetailPage

