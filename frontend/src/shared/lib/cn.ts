// import { clsx, type ClassValue } from 'clsx'

// export const cn = (...inputs: ClassValue[]) => clsx(inputs)

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type ClassValue = false | null | string | undefined

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}