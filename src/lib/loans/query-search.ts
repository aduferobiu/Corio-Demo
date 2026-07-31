import { z } from 'zod'

// Shared by every role's application detail route so a query notification's
// link can request the query thread panel open on arrival.
export const queryThreadSearchValidator = z.object({
  openQuery: z.boolean().optional(),
})
