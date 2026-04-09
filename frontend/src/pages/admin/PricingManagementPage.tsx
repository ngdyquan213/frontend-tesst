import { useAuth } from '@/app/providers/AuthProvider'
import { PricingRuleForm } from '@/features/admin/pricing/ui/PricingRuleForm'
import { ADMIN_PERMISSIONS } from '@/shared/constants/permissions'
import { hasPermission } from '@/shared/lib/auth'
import { PageHeader } from '@/shared/components/PageHeader'

const PricingManagementPage = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-10">
      <PageHeader title="Pricing Management" description="Pricing rules mapped into a usable React admin screen." />
      <PricingRuleForm canEdit={hasPermission(user, ADMIN_PERMISSIONS.couponsWrite)} />
    </div>
  )
}

export default PricingManagementPage
