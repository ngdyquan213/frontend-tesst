import { PageHeader } from '@/shared/components/PageHeader'
import { ProfileCard } from '@/features/profile/ui/ProfileCard'
import { ProfileForm } from '@/features/profile/ui/ProfileForm'

const ProfilePage = () => (
  <div className="space-y-10">
    <PageHeader title="Profile" description="Review the account profile now loading from the backend." />
    <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
      <ProfileCard />
      <ProfileForm />
    </div>
  </div>
)

export default ProfilePage
