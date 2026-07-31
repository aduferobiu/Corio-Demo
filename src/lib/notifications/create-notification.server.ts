import { db } from '#/db/client'
import { notifications } from '#/db/schema'

type NotificationType = (typeof notifications.$inferInsert)['type']

// Internal helper used by other server functions to record a notification. Kept in its
// own .server.ts file (dynamically imported from handlers) so its `db` import — and the
// Node-only `postgres` client it pulls in — never ends up in the client bundle.
export async function createNotification(params: { userId: string; type: NotificationType; title: string; body: string; link?: string }) {
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link ?? null,
  })
}
