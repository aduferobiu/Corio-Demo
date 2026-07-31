import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { createSession, destroySession, getSessionUser, verifyPassword } from './session.server'

export const loginFn = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await verifyPassword(data.email, data.password)
    if (!user) throw new Error('Invalid email or password')
    await createSession(user.id)
    return user
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  await destroySession()
  return { ok: true }
})

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(async () => {
  return getSessionUser()
})
