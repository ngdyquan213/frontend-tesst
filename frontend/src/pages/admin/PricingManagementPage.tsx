import { PricingRuleForm } from '@/features/admin/pricing/ui/PricingRuleForm'
import { PageHeader } from '@/shared/components/PageHeader'

const PricingManagementPage = () => (
  <div className="space-y-10">
    <PageHeader title="Pricing Management" description="Pricing rules mapped into a usable React admin screen." />
    <PricingRuleForm />
  </div>
)

export default PricingManagementPage

