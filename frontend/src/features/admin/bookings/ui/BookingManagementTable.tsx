import { useAdminBookingsQuery } from '@/features/admin/bookings/queries/useAdminBookingsQuery'
import { Table } from '@/shared/ui/Table'

export const BookingManagementTable = () => {
  const { data } = useAdminBookingsQuery()
  return (
    <Table columns={['Reference', 'Status', 'Total']}>
      {data?.map((booking) => (
        <tr key={booking.id}>
          <td className="px-6 py-4 font-semibold text-primary">{booking.reference}</td>
          <td className="px-6 py-4 text-on-surface-variant">{booking.status}</td>
          <td className="px-6 py-4 text-on-surface-variant">${booking.total}</td>
          <td className="px-6 py-4 text-right text-sm font-semibold text-secondary">Manage</td>
        </tr>
      ))}
    </Table>
  )
}

