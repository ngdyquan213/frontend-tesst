import { Link } from 'react-router-dom'
import { PaymentStatusPanel } from '@/features/payments/ui/PaymentStatusPanel'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

const PaymentSuccessPage = () => (
  <Card className="mx-auto max-w-2xl text-center">
    <div className="mb-4 text-5xl text-secondary">✓</div>
    <h1 className="text-3xl font-extrabold text-primary">Payment successful</h1>
    <p className="mt-3 text-on-surface-variant">Your booking is confirmed and vouchers will appear in your account.</p>
    <div className="mt-6">
      <PaymentStatusPanel status="success" />
    </div>
    <div className="mt-6">
      <Button>
        <Link to="/account/bookings">Go to my bookings</Link>
      </Button>
    </div>
  </Card>
)

export default PaymentSuccessPage

