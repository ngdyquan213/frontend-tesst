import { useBookingsQuery } from '@/features/bookings/queries/useBookingsQuery'
import { BookingCard } from '@/features/bookings/ui/BookingCard'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

const BookingsPage = () => {
  const { data = [], isPending, isError, error } = useBookingsQuery()

  return (
    <div className="space-y-10">
      <PageHeader
        title="Bookings"
        description="Review confirmed trips, in-progress reservations, and the latest booking notes."
      />
      {isPending ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[28px] border border-[color:var(--color-outline-variant)] bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-4 h-8 w-32" />
              <Skeleton className="mt-6 h-4 w-full" />
              <Skeleton className="mt-3 h-4 w-4/5" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Bookings unavailable"
          description={error.message || 'We could not load your bookings right now.'}
        />
      ) : data.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Your confirmed trips and in-progress reservations will appear here."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
        </div>
      )}
    </div>
  )
}

export default BookingsPage
