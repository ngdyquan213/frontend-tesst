import { PageHeader } from '@/shared/components/PageHeader'
import { ChangePasswordForm } from '@/features/profile/ui/ChangePasswordForm'

const ChangePasswordPage = () => (
  <div className="space-y-10">
    <PageHeader title="Change Password" />
    <ChangePasswordForm />
  </div>
)

export default ChangePasswordPage

