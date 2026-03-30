import { useBookingsQuery } from '@/features/bookings/queries/useBookingsQuery'
import { BookingCard } from '@/features/bookings/ui/BookingCard'
import { PageHeader } from '@/shared/components/PageHeader'

const BookingsPage = () => {
  const { data } = useBookingsQuery()
  return (
    <div className="space-y-10">
      <PageHeader title="Bookings" description="All bookings are now part of one connected account flow." />
      <div className="grid gap-6 md:grid-cols-2">
        {data?.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
      </div>
    </div>
  )
}

export default BookingsPage

