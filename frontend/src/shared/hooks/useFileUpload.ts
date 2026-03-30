import { useState } from 'react'

export const useFileUpload = () => {
  const [fileName, setFileName] = useState('')
  return {
    fileName,
    onSelect: (file?: File | null) => setFileName(file?.name ?? ''),
  }
}

