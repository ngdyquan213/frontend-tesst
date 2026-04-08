import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useToast } from '@/app/providers/ToastProvider'
import { useResetPasswordMutation } from '@/features/auth/queries/useResetPasswordMutation'
import { FormField } from '@/shared/forms/FormField'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export const ResetPasswordForm = () => {
  const [password, setPassword] = useState('')
  const { token: routeToken } = useParams()
  const [searchParams] = useSearchParams()
  const mutation = useResetPasswordMutation()
  const { pushToast } = useToast()
  const resetToken = routeToken ?? searchParams.get('token')?.trim() ?? ''

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()

        if (!resetToken) {
          return
        }

        await mutation.mutateAsync({ password, token: resetToken })
        pushToast('Password reset complete.', 'success')
      }}
    >
      <div>
        <h1 className="text-3xl font-extrabold text-primary">Reset password</h1>
        <p className="mt-2 text-on-surface-variant">Choose a new password for your TravelBook account.</p>
      </div>
      {!resetToken ? (
        <Alert tone="danger">
          This reset link is missing its verification token. Please request a new password reset email.
        </Alert>
      ) : null}
      {mutation.isError ? <Alert tone="danger">{mutation.error.message}</Alert> : null}
      <FormField label="New password">
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </FormField>
      <Button className="w-full" type="submit" disabled={!resetToken || password.trim().length === 0}>
        Update password
      </Button>
    </form>
  )
}
