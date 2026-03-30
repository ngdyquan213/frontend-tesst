import { z } from 'zod'

export const travelerSchema = z.object({
  fullName: z.string().min(2),
})

