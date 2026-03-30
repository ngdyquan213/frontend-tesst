import { useBookingsQuery } from '@/features/bookings/queries/useBookingsQuery'
import { BookingCard } from '@/features/bookings/ui/BookingCard'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const BookingHistorySection = () => {
  const { data } = useBookingsQuery()
  return (
    <section>
      <SectionHeader title="Booking history" />
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
      </div>
    </section>
  )
}

