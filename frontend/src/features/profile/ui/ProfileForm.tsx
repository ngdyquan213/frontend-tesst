import { useEffect, useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useProfileQuery } from '@/features/profile/queries/useProfileQuery'
import { useUpdateProfileMutation } from '@/features/profile/queries/useUpdateProfileMutation'
import { FormField } from '@/shared/forms/FormField'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'

export const ProfileForm = () => {
  const { data } = useProfileQuery()
  const updateProfileMutation = useUpdateProfileMutation()
  const { pushToast } = useToast()
  const [name, setName] = useState('')

  useEffect(() => {
    setName(data?.name ?? '')
  }, [data?.name])

  return (
    <Card>
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault()
          await updateProfileMutation.mutateAsync({ name: name.trim() })
          pushToast('Profile updated successfully.', 'success')
        }}
      >
        {updateProfileMutation.isError ? (
          <Alert tone="danger">{updateProfileMutation.error.message}</Alert>
        ) : (
          <Alert tone="info">Your full name now saves to the live account profile.</Alert>
        )}
        <FormField label="Full name">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <FormField label="Location">
          <Input value={data?.location ?? 'Traveler account'} readOnly />
        </FormField>
        <div className="flex justify-end">
          <Button type="submit" loading={updateProfileMutation.isPending} disabled={name.trim().length === 0}>
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  )
}
