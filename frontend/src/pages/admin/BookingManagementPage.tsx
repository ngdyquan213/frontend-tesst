import { BookingManagementTable } from '@/features/admin/bookings/ui/BookingManagementTable'
import { PageHeader } from '@/shared/components/PageHeader'

const BookingManagementPage = () => (
  <div className="space-y-10">
    <PageHeader title="Booking Management" />
    <BookingManagementTable />
  </div>
)

export default BookingManagementPage

