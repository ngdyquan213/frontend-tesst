import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppErrorBoundary } from '@/app/AppErrorBoundary'
import { AppProvider } from '@/app/providers/AppProvider'
import App from '@/app/App'
import '@/shared/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
