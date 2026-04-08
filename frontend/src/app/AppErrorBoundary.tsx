import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void error
    void errorInfo
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-16">
          <div className="w-full space-y-6">
            <EmptyState
              title="TravelBook could not finish loading"
              description="A runtime error interrupted the app before the page could render safely."
            />
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">
                Reload app
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
