import type { AdminTourRecord } from '@/features/admin/tours/api/adminTours.api'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Table } from '@/shared/ui/Table'

interface TourManagementTableProps {
  tours?: AdminTourRecord[]
  isPending?: boolean
  onEditTour: (tour: AdminTourRecord) => void
}

export const TourManagementTable = ({ tours, isPending = false, onEditTour }: TourManagementTableProps) => {
  if (isPending) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    )
  }

  if (!tours || tours.length === 0) {
    return (
      <EmptyState
        title="No tours available"
        description="Create the first tour here so operations can attach schedules and pricing."
      />
    )
  }

  return (
    <Table columns={['Code', 'Tour', 'Destination', 'Status', 'Price from']}>
      {tours.map((tour) => (
        <tr key={tour.id}>
          <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{tour.code}</td>
          <td className="px-6 py-4">
            <div>
              <p className="font-semibold text-primary">{tour.title}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {tour.durationDays}d / {tour.durationNights}n
              </p>
            </div>
          </td>
          <td className="px-6 py-4 text-on-surface-variant">{tour.location}</td>
          <td className="px-6 py-4">
            <Badge variant={tour.status === 'active' ? 'success' : 'gray'}>
              {tour.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </td>
          <td className="px-6 py-4 text-on-surface-variant">${tour.priceFrom}</td>
          <td className="px-6 py-4 text-right">
            <Button variant="ghost" size="sm" onClick={() => onEditTour(tour)}>
              Edit
            </Button>
          </td>
        </tr>
      ))}
    </Table>
  )
}
