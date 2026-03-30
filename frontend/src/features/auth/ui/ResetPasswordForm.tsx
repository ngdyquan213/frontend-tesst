import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useResetPasswordMutation } from '@/features/auth/queries/useResetPasswordMutation'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export const ResetPasswordForm = () => {
  const [password, setPassword] = useState('travel123')
  const mutation = useResetPasswordMutation()
  const { pushToast } = useToast()

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        await mutation.mutateAsync()
        pushToast('Password reset complete.', 'success')
      }}
    >
      <div>
        <h1 className="text-3xl font-extrabold text-primary">Reset password</h1>
        <p className="mt-2 text-on-surface-variant">Choose a new password for your TravelBook account.</p>
      </div>
      <FormField label="New password">
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </FormField>
      <Button className="w-full" type="submit">
        Update password
      </Button>
    </form>
  )
}

