import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useChangePasswordMutation } from '@/features/profile/queries/useChangePasswordMutation'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'

export const ChangePasswordForm = () => {
  const [password, setPassword] = useState('')
  const mutation = useChangePasswordMutation()
  const { pushToast } = useToast()

  return (
    <Card>
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault()
          await mutation.mutateAsync()
          setPassword('')
          pushToast('Password changed successfully.', 'success')
        }}
      >
        <FormField label="New password">
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </FormField>
        <Button type="submit">Update password</Button>
      </form>
    </Card>
  )
}

