import { TicketForm } from '@/features/support/ui/TicketForm'
import { Card } from '@/shared/ui/Card'
import { PageHeader } from '@/shared/components/PageHeader'

const HelpPage = () => (
  <div className="page-shell grid gap-8 py-12 lg:grid-cols-[1.2fr_0.8fr]">
    <div>
      <PageHeader title="Help & Support" description="Secure answers, booking help, and document assistance in one place." />
      <TicketForm />
    </div>
    <Card>
      <h3 className="text-xl font-bold text-primary">Support availability</h3>
      <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
        <li>24/7 global traveler support</li>
        <li>Operator coordination for schedule changes</li>
        <li>Document and payment troubleshooting</li>
      </ul>
    </Card>
  </div>
)

export default HelpPage

