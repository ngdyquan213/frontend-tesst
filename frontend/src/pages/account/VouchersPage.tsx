import { PageHeader } from '@/shared/components/PageHeader'
import { VoucherViewer } from '@/features/vouchers/ui/VoucherViewer'

const VouchersPage = () => (
  <div className="space-y-10">
    <PageHeader title="Vouchers" description="Voucher states now live inside the same account shell." />
    <VoucherViewer />
  </div>
)

export default VouchersPage

