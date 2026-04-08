import { Alert } from '@/shared/ui/Alert'
import { Card } from '@/shared/ui/Card'

export const TravelerInfoSection = () => {
  return (
    <Card>
      <h2 className="mb-6 text-2xl font-bold text-primary">Traveler information</h2>
      <Alert tone="info">
        Payment is temporarily deferred. We will create the booking first, then traveler assignment can be completed
        from your account once the dedicated booking-traveler flow is enabled.
      </Alert>
    </Card>
  )
}
