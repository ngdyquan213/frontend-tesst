import type { PropsWithChildren, ReactElement } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { createTestQueryClient } from '@/tests/utils/createTestQueryClient'

interface RenderWithProvidersOptions {
  initialEntries?: string[]
}

export const renderWithProviders = (ui: ReactElement, options: RenderWithProvidersOptions = {}) => {
  const queryClient = createTestQueryClient()

  const Wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={options.initialEntries}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </MemoryRouter>
  )

  return render(ui, { wrapper: Wrapper })
}
