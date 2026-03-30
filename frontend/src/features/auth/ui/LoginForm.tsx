import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '@/app/providers/ToastProvider'
import { sampleCredentials } from '@/features/auth/model/auth.store'
import { useLoginMutation } from '@/features/auth/queries/useLoginMutation'
import { FormField } from '@/shared/forms/FormField'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export const LoginForm = () => {
  const [email, setEmail] = useState(sampleCredentials.traveler)
  const [password, setPassword] = useState('travel123')
  const mutation = useLoginMutation()
  const navigate = useNavigate()
  const location = useLocation()
  const { pushToast } = useToast()

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        const user = await mutation.mutateAsync({ email, password })
        pushToast(`Welcome back, ${user.name}`, 'success')
        const redirectTo = location.state?.from?.pathname ?? (user.role === 'admin' ? '/admin' : '/account')
        navigate(redirectTo)
      }}
    >
      <div>
        <h1 className="text-3xl font-extrabold text-primary">Welcome back</h1>
        <p className="mt-2 text-on-surface-variant">Use `admin@travelbook.com` to preview the admin shell.</p>
      </div>
      <FormField label="Email">
        <Input value={email} onChange={(event) => setEmail(event.target.value)} />
      </FormField>
      <FormField label="Password">
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </FormField>
      <Button className="w-full" type="submit">
        Continue
      </Button>
    </form>
  )
}

