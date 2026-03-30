import { z } from 'zod'

export const refundSchema = z.object({
  reason: z.string().min(10),
})

