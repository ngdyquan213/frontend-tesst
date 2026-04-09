import { Link } from 'react-router-dom'
import { useAdminBookingsQuery } from '@/features/admin/bookings/queries/useAdminBookingsQuery'
import { CurrencyText } from '@/shared/components/CurrencyText'
import { Table } from '@/shared/ui/Table'

export const BookingManagementTable = () => {
  const { data } = useAdminBookingsQuery()
  return (
    <Table columns={['Reference', 'Status', 'Total']}>
      {data?.map((booking) => (
        <tr key={booking.id}>
          <td className="px-6 py-4 font-semibold text-primary">{booking.reference}</td>
          <td className="px-6 py-4 text-on-surface-variant">{booking.status}</td>
          <td className="px-6 py-4 text-on-surface-variant">
            <CurrencyText value={booking.total} currency={booking.currency} />
          </td>
          <td className="px-6 py-4 text-right text-sm font-semibold">
            <Link
              to={`/admin/bookings/${booking.id}`}
              className="text-secondary transition hover:text-primary"
            >
              Review details
            </Link>
          </td>
        </tr>
      ))}
    </Table>
  )
}
