import { useBookingsQuery } from '@/features/bookings/queries/useBookingsQuery'
import { BookingCard } from '@/features/bookings/ui/BookingCard'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

function BookingCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-lowest)] p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="space-y-3 text-right">
          <Skeleton className="ml-auto h-3 w-12" />
          <Skeleton className="ml-auto h-6 w-20" />
        </div>
      </div>
      <Skeleton className="mt-6 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-6 h-10 w-28" />
    </div>
  )
}

export const BookingHistorySection = () => {
  const { data, isPending } = useBookingsQuery()

  return (
    <section className="space-y-5">
      <SectionHeader title="Booking history" />
      {isPending ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <BookingCardSkeleton key={index} />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
        </div>
      ) : (
        <EmptyState
          title="No bookings yet"
          description="Confirmed trips and in-progress reservations will appear here once your travel plan is saved."
        />
      )}
    </section>
  )
}
