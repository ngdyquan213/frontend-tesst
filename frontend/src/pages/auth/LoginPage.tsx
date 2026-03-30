import { Link } from 'react-router-dom'
import { LoginForm } from '@/features/auth/ui/LoginForm'

const LoginPage = () => (
  <div className="space-y-6">
    <LoginForm />
    <div className="flex justify-between text-sm text-on-surface-variant">
      <Link to="/auth/forgot-password">Forgot password?</Link>
      <Link to="/auth/register">Create account</Link>
    </div>
  </div>
)

export default LoginPage

