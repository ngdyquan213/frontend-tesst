import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useProfileQuery } from '@/features/profile/queries/useProfileQuery'
import { useUpdateProfileMutation } from '@/features/profile/queries/useUpdateProfileMutation'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'

export const ProfileForm = () => {
  const { data } = useProfileQuery()
  const mutation = useUpdateProfileMutation()
  const { pushToast } = useToast()
  const [name, setName] = useState(data?.name ?? 'Alexander Sterling')
  const [location, setLocation] = useState(data?.location ?? 'Zurich, Switzerland')

  return (
    <Card>
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault()
          await mutation.mutateAsync({ name, location })
          pushToast('Profile updated.', 'success')
        }}
      >
        <FormField label="Full name">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <FormField label="Location">
          <Input value={location} onChange={(event) => setLocation(event.target.value)} />
        </FormField>
        <Button type="submit">Save profile</Button>
      </form>
    </Card>
  )
}

