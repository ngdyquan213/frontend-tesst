import { useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useAdminToursQuery } from '@/features/admin/tours/queries/useAdminToursQuery'
import type { AdminTourRecord } from '@/features/admin/tours/api/adminTours.api'
import { TourFormDrawer } from '@/features/admin/tours/ui/TourFormDrawer'
import { TourManagementTable } from '@/features/admin/tours/ui/TourManagementTable'
import { ADMIN_PERMISSIONS } from '@/shared/constants/permissions'
import { useDisclosure } from '@/shared/hooks/useDisclosure'
import { hasPermission } from '@/shared/lib/auth'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Pagination } from '@/shared/ui/Pagination'

const PAGE_SIZE = 10

const TourManagementPage = () => {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const toursQuery = useAdminToursQuery(page, PAGE_SIZE)
  const { open, onClose, onOpen } = useDisclosure(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selectedTour, setSelectedTour] = useState<AdminTourRecord | null>(null)
  const canWriteTours = hasPermission(user, ADMIN_PERMISSIONS.toursWrite)
  const total = toursQuery.data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleCreate = () => {
    setMode('create')
    setSelectedTour(null)
    onOpen()
  }

  const handleEdit = (tour: AdminTourRecord) => {
    setMode('edit')
    setSelectedTour(tour)
    onOpen()
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Tour Management"
        description="Create and maintain live tour inventory without leaving the admin shell."
        actions={
          <Button onClick={handleCreate} disabled={!canWriteTours}>
            Add tour
          </Button>
        }
      />
      <TourManagementTable
        tours={toursQuery.data?.items}
        isPending={toursQuery.isPending}
        errorMessage={toursQuery.isError ? 'We could not load the tour inventory right now.' : undefined}
        canEdit={canWriteTours}
        onEditTour={handleEdit}
      />
      {total > PAGE_SIZE ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
      <TourFormDrawer
        open={open}
        mode={mode}
        tour={selectedTour}
        canWrite={canWriteTours}
        onClose={onClose}
      />
    </div>
  )
}

export default TourManagementPage
