import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { PaymentStatusPanel } from '@/features/payments/ui/PaymentStatusPanel'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useCheckoutContext } from '@/widgets/checkout/useCheckoutContext'

const PaymentSuccessPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const checkout = useCheckoutContext()

  return (
    <Card className="mx-auto max-w-2xl text-center">
      <div className="mb-4 text-5xl text-secondary">✓</div>
      <h1 className="text-3xl font-extrabold text-primary">Payment successful</h1>
      <p className="mt-3 text-on-surface-variant">
        Your {checkout.tourName} departure is confirmed and the next trip updates are now in motion.
      </p>
      <div className="mt-6">
        <PaymentStatusPanel status="success" />
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          onClick={() => navigate(isAuthenticated ? '/account/bookings' : '/auth/login')}
        >
          {isAuthenticated ? 'Go to my bookings' : 'Sign in to manage booking'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/')}>
          Back home
        </Button>
      </div>
    </Card>
  )
}

export default PaymentSuccessPage
