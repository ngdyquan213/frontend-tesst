import type { InputHTMLAttributes } from 'react'

export const Checkbox = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20" type="checkbox" {...props} />
)

