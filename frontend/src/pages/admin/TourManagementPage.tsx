import { useState } from 'react'
import { useAdminToursQuery } from '@/features/admin/tours/queries/useAdminToursQuery'
import type { AdminTourRecord } from '@/features/admin/tours/api/adminTours.api'
import { TourFormDrawer } from '@/features/admin/tours/ui/TourFormDrawer'
import { TourManagementTable } from '@/features/admin/tours/ui/TourManagementTable'
import { useDisclosure } from '@/shared/hooks/useDisclosure'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/ui/Button'

const TourManagementPage = () => {
  const { data, isPending } = useAdminToursQuery()
  const { open, onClose, onOpen } = useDisclosure(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selectedTour, setSelectedTour] = useState<AdminTourRecord | null>(null)

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
          <Button onClick={handleCreate}>
            Add tour
          </Button>
        }
      />
      <TourManagementTable tours={data} isPending={isPending} onEditTour={handleEdit} />
      <TourFormDrawer open={open} mode={mode} tour={selectedTour} onClose={onClose} />
    </div>
  )
}

export default TourManagementPage
