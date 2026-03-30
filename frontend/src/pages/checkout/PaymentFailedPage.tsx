import { Link } from 'react-router-dom'
import { PaymentStatusPanel } from '@/features/payments/ui/PaymentStatusPanel'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

const PaymentFailedPage = () => (
  <Card className="mx-auto max-w-2xl text-center">
    <div className="mb-4 text-5xl text-danger">!</div>
    <h1 className="text-3xl font-extrabold text-primary">Payment failed</h1>
    <p className="mt-3 text-on-surface-variant">No worries, your selection is still available for a short time.</p>
    <div className="mt-6">
      <PaymentStatusPanel status="failed" />
    </div>
    <div className="mt-6">
      <Button>
        <Link to="/checkout/payment">Try another method</Link>
      </Button>
    </div>
  </Card>
)

export default PaymentFailedPage

