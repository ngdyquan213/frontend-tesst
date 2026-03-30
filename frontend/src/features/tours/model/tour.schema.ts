import { z } from 'zod'

export const tourSearchSchema = z.object({
  search: z.string().optional(),
})

