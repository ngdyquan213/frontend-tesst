import { PageHeader } from '@/shared/components/PageHeader'
import { TicketForm } from '@/features/support/ui/TicketForm'
import { TicketList } from '@/features/support/ui/TicketList'

const SupportPage = () => (
  <div className="space-y-10">
    <PageHeader title="Support" description="Support requests keep the same premium shell as the rest of the account area." />
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <TicketForm />
      <TicketList />
    </div>
  </div>
)

export default SupportPage

