import { createMiddleware } from '@tanstack/react-start'

import { getSessionUser } from './session.server'
import type { Role } from './types'

export const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')
  return next({ context: { user } })
})

export function requireRole(...roles: Role[]) {
  return createMiddleware({ type: 'function' })
    .middleware([authMiddleware])
    .server(async ({ next, context }) => {
      if (!roles.includes(context.user.role)) throw new Error('Forbidden')
      return next()
    })
}
