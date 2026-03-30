import { useState } from 'react'
import { initialRootState } from '@/app/store/rootReducer'

export const useAppStore = () => {
  const [state, setState] = useState(initialRootState)

  return {
    state,
    toggleSidebar: () =>
      setState((current) => ({
        shell: {
          sidebarOpen: !current.shell.sidebarOpen,
        },
      })),
  }
}

