import { desc, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { db } from '#/db/client'
import { users } from '#/db/schema'
import { requireRole } from '#/lib/auth/middleware'
import { ROLES } from '#/lib/auth/types'

export const listTeamMembersFn = createServerFn({ method: 'GET' })
  .middleware([requireRole('md', 'admin')])
  .handler(async () => {
    return db.select().from(users).orderBy(desc(users.createdAt))
  })

const DEFAULT_TEMP_PASSWORD = '12345'

export const createTeamMemberFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md', 'admin')])
  .validator(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      role: z.enum(ROLES),
    }),
  )
  .handler(async ({ data }) => {
    const [existing] = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
    if (existing) throw new Error('A user with that email already exists')

    const passwordHash = await bcrypt.hash(DEFAULT_TEMP_PASSWORD, 10)
    const [user] = await db
      .insert(users)
      .values({ name: data.name, email: data.email, role: data.role, passwordHash, status: 'pending' })
      .returning()

    return user
  })

export const updateTeamMemberFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md', 'admin')])
  .validator(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      role: z.enum(ROLES),
    }),
  )
  .handler(async ({ data }) => {
    const [user] = await db
      .update(users)
      .set({ name: data.name, role: data.role, updatedAt: new Date() })
      .where(eq(users.id, data.id))
      .returning()
    if (!user) throw new Error('Not found')
    return user
  })

export const deleteTeamMemberFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md', 'admin')])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    if (data.id === context.user.id) throw new Error('You cannot delete your own account')
    try {
      await db.delete(users).where(eq(users.id, data.id))
    } catch {
      throw new Error('This user has associated records and cannot be deleted')
    }
    return { ok: true }
  })
