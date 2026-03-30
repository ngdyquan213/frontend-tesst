import { useAdminToursQuery } from '@/features/admin/tours/queries/useAdminToursQuery'
import { Table } from '@/shared/ui/Table'

export const TourManagementTable = () => {
  const { data } = useAdminToursQuery()
  return (
    <Table columns={['Tour', 'Location', 'Price']}>
      {data?.map((tour) => (
        <tr key={tour.id}>
          <td className="px-6 py-4 font-semibold text-primary">{tour.title}</td>
          <td className="px-6 py-4 text-on-surface-variant">{tour.location}</td>
          <td className="px-6 py-4 text-on-surface-variant">${tour.priceFrom}</td>
          <td className="px-6 py-4 text-right text-sm font-semibold text-secondary">Edit</td>
        </tr>
      ))}
    </Table>
  )
}

