import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useChangePasswordMutation } from '@/features/profile/queries/useChangePasswordMutation'
import { Alert } from '@/shared/ui/Alert'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'

export const ChangePasswordForm = () => {
  const mutation = useChangePasswordMutation()
  const { pushToast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  return (
    <Card>
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault()
          await mutation.mutateAsync({ currentPassword, newPassword })
          setCurrentPassword('')
          setNewPassword('')
          pushToast('Password changed successfully. Other sessions will need to sign in again.', 'success')
        }}
      >
        {mutation.isError ? (
          <Alert tone="danger">{mutation.error.message}</Alert>
        ) : (
          <Alert tone="info">Changing your password now revokes older refresh sessions for safety.</Alert>
        )}
        <FormField label="Current password">
          <Input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </FormField>
        <FormField label="New password">
          <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </FormField>
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={currentPassword.trim().length === 0 || newPassword.trim().length === 0}
          >
            Update password
          </Button>
        </div>
      </form>
    </Card>
  )
}
