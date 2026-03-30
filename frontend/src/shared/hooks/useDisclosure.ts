import { useState } from 'react'

export const useDisclosure = (initialValue = false) => {
  const [open, setOpen] = useState(initialValue)

  return {
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onToggle: () => setOpen((value) => !value),
  }
}
