export interface RootState {
  shell: {
    sidebarOpen: boolean
  }
}

export const initialRootState: RootState = {
  shell: {
    sidebarOpen: true,
  },
}

