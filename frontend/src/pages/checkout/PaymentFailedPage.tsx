import { useNavigate } from 'react-router-dom'
import { PaymentStatusPanel } from '@/features/payments/ui/PaymentStatusPanel'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useCheckoutContext } from '@/widgets/checkout/useCheckoutContext'

const PaymentFailedPage = () => {
  const navigate = useNavigate()
  const checkout = useCheckoutContext()

  return (
    <Card className="mx-auto max-w-2xl text-center">
      <div className="mb-4 text-5xl text-danger">!</div>
      <h1 className="text-3xl font-extrabold text-primary">Payment failed</h1>
      <p className="mt-3 text-on-surface-variant">
        No worries, your selected {checkout.scheduleLabel.toLowerCase()} departure is still reserved for a
        short time.
      </p>
      <div className="mt-6">
        <PaymentStatusPanel status="failed" />
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => navigate(checkout.paymentPath)}>
          Try another method
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(checkout.checkoutPath)}>
          Back to checkout
        </Button>
      </div>
    </Card>
  )
}

export default PaymentFailedPage
