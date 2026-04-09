import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '@/app/providers/ToastProvider'
import { validateLoginPayload } from '@/features/auth/model/auth.schema'
import { useLoginMutation } from '@/features/auth/queries/useLoginMutation'
import { FormField } from '@/shared/forms/FormField'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const mutation = useLoginMutation()
  const navigate = useNavigate()
  const location = useLocation()
  const { pushToast } = useToast()

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        const validation = validateLoginPayload({ email, password })
        if (!validation.success) {
          setErrors(validation.errors)
          return
        }

        setErrors({})

        try {
          const user = await mutation.mutateAsync(validation.data)
          pushToast(`Welcome back, ${user.name}`, 'success')
          const redirectTo =
            location.state?.from?.pathname ?? (user.role === 'admin' ? '/admin' : '/account')
          navigate(redirectTo)
        } catch {
          return
        }
      }}
    >
      <div>
        <h1 className="text-3xl font-extrabold text-primary">Welcome back</h1>
        <p className="mt-2 text-on-surface-variant">Sign in to manage departures, bookings, and trip updates.</p>
      </div>
      {mutation.isError ? <Alert tone="danger">{mutation.error.message}</Alert> : null}
      <FormField label="Email" error={errors.email}>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (errors.email) {
              setErrors((currentErrors) => ({ ...currentErrors, email: undefined }))
            }
          }}
          aria-invalid={Boolean(errors.email)}
        />
      </FormField>
      <FormField label="Password" error={errors.password}>
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            if (errors.password) {
              setErrors((currentErrors) => ({ ...currentErrors, password: undefined }))
            }
          }}
          aria-invalid={Boolean(errors.password)}
        />
      </FormField>
      <Button className="w-full" type="submit" loading={mutation.isPending}>
        Continue
      </Button>
    </form>
  )
}
