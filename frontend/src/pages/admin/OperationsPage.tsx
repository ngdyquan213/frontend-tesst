import { useAuth } from '@/app/providers/AuthProvider'
import { ADMIN_PERMISSIONS } from '@/shared/constants/permissions'
import { hasPermission } from '@/shared/lib/auth'
import { OperationsBoard } from '@/features/admin/operations/ui/OperationsBoard'
import { PageHeader } from '@/shared/components/PageHeader'

const OperationsPage = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-10">
      <PageHeader title="Operations" />
      <OperationsBoard canManageTickets={hasPermission(user, ADMIN_PERMISSIONS.supportWrite)} />
    </div>
  )
}

export default OperationsPage
