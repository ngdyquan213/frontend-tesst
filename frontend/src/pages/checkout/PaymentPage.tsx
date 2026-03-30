import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAvailablePaymentMethodsQuery } from '@/features/payments/queries/useAvailablePaymentMethodsQuery'
import { PaymentMethodSelector } from '@/features/payments/ui/PaymentMethodSelector'
import { Button } from '@/shared/ui/Button'
import { PaymentSummarySection } from '@/widgets/checkout/PaymentSummarySection'

const PaymentPage = () => {
  const { data } = useAvailablePaymentMethodsQuery()
  const [selectedId, setSelectedId] = useState('method-1')

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">Payment</h1>
          <p className="mt-2 text-on-surface-variant">Choose a payment method to complete this booking.</p>
        </div>
        <PaymentMethodSelector methods={data ?? []} onChange={setSelectedId} selectedId={selectedId} />
        <div className="flex gap-3">
          <Button>
            <Link to="/checkout/payment/success">Pay now</Link>
          </Button>
          <Button variant="outline">
            <Link to="/checkout/payment/failed">Preview failed state</Link>
          </Button>
        </div>
      </div>
      <PaymentSummarySection />
    </div>
  )
}

export default PaymentPage

