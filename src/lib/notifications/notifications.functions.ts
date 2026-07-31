import { and, desc, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db/client'
import { notifications } from '#/db/schema'
import { authMiddleware } from '#/lib/auth/middleware'

export const listNotificationsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, context.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50)
  })

export const markNotificationReadFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, data.id), eq(notifications.userId, context.user.id)))
    return { ok: true }
  })

export const markAllNotificationsReadFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, context.user.id))
    return { ok: true }
  })
