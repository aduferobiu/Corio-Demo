import { eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { db } from '#/db/client'
import { users } from '#/db/schema'
import { authMiddleware } from '#/lib/auth/middleware'

export const updateProfileFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      avatarUrl: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const [existing] = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
    if (existing && existing.id !== context.user.id) throw new Error('That email address is already in use')

    const [updated] = await db
      .update(users)
      .set({ name: data.name, email: data.email, avatarUrl: data.avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, context.user.id))
      .returning()

    return updated
  })

export const changePasswordFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }),
  )
  .handler(async ({ context, data }) => {
    const [user] = await db.select().from(users).where(eq(users.id, context.user.id)).limit(1)
    if (!user) throw new Error('Not found')

    const matches = await bcrypt.compare(data.currentPassword, user.passwordHash)
    if (!matches) throw new Error('Current password is incorrect')

    const passwordHash = await bcrypt.hash(data.newPassword, 10)
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, context.user.id))

    return { ok: true }
  })
