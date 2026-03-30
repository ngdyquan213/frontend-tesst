import { useQuery } from '@tanstack/react-query'
import { adminDashboardApi } from '@/features/admin/dashboard/api/adminDashboard.api'

export const useAdminDashboardQuery = () =>
  useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminDashboardApi.getDashboard,
  })

