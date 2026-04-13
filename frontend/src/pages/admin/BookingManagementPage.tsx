import { useState } from 'react'
import { useAdminBookingsQuery } from '@/features/admin/bookings/queries/useAdminBookingsQuery'
import { BookingManagementTable } from '@/features/admin/bookings/ui/BookingManagementTable'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'

const PAGE_SIZE = 10

const BookingManagementPage = () => {
  const [page, setPage] = useState(1)
  const bookingsQuery = useAdminBookingsQuery(page, PAGE_SIZE)
  const total = bookingsQuery.data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-10">
      <PageHeader title="Booking Management" />
      <BookingManagementTable
        bookings={bookingsQuery.data?.items}
        isPending={bookingsQuery.isPending}
        errorMessage={
          bookingsQuery.isError ? 'We could not load the booking queue right now.' : undefined
        }
      />
      {total > PAGE_SIZE ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  )
}

export default BookingManagementPage
