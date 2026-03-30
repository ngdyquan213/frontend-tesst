import { BookingManagementTable } from '@/features/admin/bookings/ui/BookingManagementTable'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const BookingQueueSection = () => (
  <section>
    <SectionHeader title="Booking queue" />
    <BookingManagementTable />
  </section>
)

