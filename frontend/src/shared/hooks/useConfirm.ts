export const useConfirm = () => ({
  confirm: (message: string) => Promise.resolve(window.confirm(message)),
})

