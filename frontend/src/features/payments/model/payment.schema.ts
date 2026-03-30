import { z } from 'zod'

export const paymentSchema = z.object({
  methodId: z.string().min(1),
})

