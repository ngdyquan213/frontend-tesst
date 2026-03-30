import type { InputHTMLAttributes } from 'react'

export const Radio = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input className="h-4 w-4 border-outline-variant text-primary focus:ring-primary/20" type="radio" {...props} />
)

