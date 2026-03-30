import type { PropsWithChildren } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import { cn } from '@/shared/lib/cn'

type ToastTone = 'info' | 'success' | 'warning' | 'danger'

interface ToastContextValue {
  pushToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; tone: ToastTone }>>([])

  const value = useMemo(
    () => ({
      pushToast: (message: string, tone: ToastTone = 'info') => {
        const id = crypto.randomUUID()
        setToasts((current) => [...current, { id, message, tone }])
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }, 2800)
      },
    }),
    [],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[120] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'rounded-2xl px-4 py-3 text-sm font-medium shadow-lg',
              toast.tone === 'info' && 'bg-primary text-white',
              toast.tone === 'success' && 'bg-success text-white',
              toast.tone === 'warning' && 'bg-warning text-white',
              toast.tone === 'danger' && 'bg-danger text-white',
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

