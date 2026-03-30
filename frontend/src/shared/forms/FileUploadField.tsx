import type { InputHTMLAttributes } from 'react'
import { Input } from '@/shared/ui/Input'

export const FileUploadField = (props: InputHTMLAttributes<HTMLInputElement>) => <Input type="file" {...props} />

