import { z } from 'zod'

export const bookingSchema = z.object({
  travelerCount: z.number().min(1),
})

