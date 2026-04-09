import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/app/providers/ToastProvider'
import { validateRegisterPayload } from '@/features/auth/model/auth.schema'
import { useRegisterMutation } from '@/features/auth/queries/useRegisterMutation'
import { FormField } from '@/shared/forms/FormField'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export const RegisterForm = () => {
  const mutation = useRegisterMutation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        const validation = validateRegisterPayload({ name, email, password })
        if (!validation.success) {
          setErrors(validation.errors)
          return
        }

        setErrors({})

        try {
          await mutation.mutateAsync(validation.data)
          pushToast('Account created and signed in.', 'success')
          navigate('/account')
        } catch {
          return
        }
      }}
    >
      <div>
        <h1 className="text-3xl font-extrabold text-primary">Create account</h1>
        <p className="mt-2 text-on-surface-variant">
          Set up your traveler profile once, then manage bookings and trip updates in one place.
        </p>
      </div>
      {mutation.isError ? <Alert tone="danger">{mutation.error.message}</Alert> : null}
      <FormField label="Full name" error={errors.name}>
        <Input
          autoComplete="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (errors.name) {
              setErrors((currentErrors) => ({ ...currentErrors, name: undefined }))
            }
          }}
          aria-invalid={Boolean(errors.name)}
        />
      </FormField>
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
          autoComplete="new-password"
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
        Create account
      </Button>
    </form>
  )
}
