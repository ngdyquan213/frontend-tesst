import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useVerifyEmailMutation } from '@/features/auth/queries/useVerifyEmailMutation'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const verifyEmailMutation = useVerifyEmailMutation()
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (!token || hasTriggered.current) {
      return
    }

    hasTriggered.current = true
    void verifyEmailMutation.mutateAsync({ token })
  }, [token, verifyEmailMutation])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold text-primary">Verify email</h1>
        <p className="mt-2 text-on-surface-variant">
          We are confirming the email token from your TravelBook verification link.
        </p>
      </div>

      {!token ? (
        <Alert tone="danger">
          This verification link is missing its token. Please request a fresh verification email.
        </Alert>
      ) : null}

      {verifyEmailMutation.isSuccess ? (
        <Alert tone="success">Your email is now verified. You can continue using your account.</Alert>
      ) : null}

      {verifyEmailMutation.isError ? (
        <Alert tone="danger">{verifyEmailMutation.error.message}</Alert>
      ) : null}

      {token && !verifyEmailMutation.isSuccess && !verifyEmailMutation.isError ? (
        <Alert tone="info">Verifying your email now...</Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {token && verifyEmailMutation.isError ? (
          <Button
            type="button"
            onClick={() => verifyEmailMutation.mutate({ token })}
            disabled={verifyEmailMutation.isPending}
          >
            Try again
          </Button>
        ) : null}
        <Link
          className="inline-flex items-center justify-center rounded-xl border border-[color:var(--color-outline)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary)] transition-all duration-300 hover:bg-[color:var(--color-surface-low)]"
          to="/auth/login"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}

export default VerifyEmailPage
