import { desc, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db/client'
import { roles } from '#/db/schema'
import { requireRole } from '#/lib/auth/middleware'

export const listRolesFn = createServerFn({ method: 'GET' })
  .middleware([requireRole('md', 'admin')])
  .handler(async () => {
    const rows = await db.select().from(roles).orderBy(desc(roles.createdAt))
    return rows.map((r) => ({ ...r, permissions: JSON.parse(r.permissions) as string[] }))
  })

const roleSchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()).min(1),
})

export const createRoleFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md', 'admin')])
  .validator(roleSchema)
  .handler(async ({ context, data }) => {
    const [role] = await db
      .insert(roles)
      .values({ name: data.name, permissions: JSON.stringify(data.permissions), createdByUserId: context.user.id })
      .returning()
    return { ...role, permissions: data.permissions }
  })

export const updateRoleFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md', 'admin')])
  .validator(roleSchema.extend({ id: z.string() }))
  .handler(async ({ data }) => {
    const [role] = await db
      .update(roles)
      .set({ name: data.name, permissions: JSON.stringify(data.permissions), updatedAt: new Date() })
      .where(eq(roles.id, data.id))
      .returning()
    if (!role) throw new Error('Not found')
    return { ...role, permissions: data.permissions }
  })

export const deleteRoleFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md', 'admin')])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(roles).where(eq(roles.id, data.id))
    return { ok: true }
  })
