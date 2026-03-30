import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
})

