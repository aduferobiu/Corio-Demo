import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { X } from 'lucide-react'
import { toast } from 'sonner'

import { usePoll } from '#/lib/hooks/use-poll'
import { playNotificationSound } from '#/lib/notification-sound'
import { NOTIFICATION_ICONS } from '#/lib/notifications/notification-icons'
import { listNotificationsFn } from '#/lib/notifications/notifications.functions'

type Notification = Awaited<ReturnType<typeof listNotificationsFn>>[number]

// Persisted (not just held in a ref) because this component can remount —
// e.g. on a hard navigation — and an in-memory "seen" set would otherwise
// reset and either replay old notifications or silently swallow new ones
// that arrive in the same instant as a remount.
const STORAGE_KEY = 'corio:notifications:lastSeenAt'

function getLastSeenAt(): number | null {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  return stored ? Number(stored) : null
}

function setLastSeenAt(ts: number) {
  sessionStorage.setItem(STORAGE_KEY, String(ts))
}

// Mounted once in the authenticated layout so it keeps polling across
// navigation — surfaces a toast + chime the moment a new notification
// arrives, from any screen.
export function NotificationWatcher() {
  const navigate = useNavigate()
  const listNotifications = useServerFn(listNotificationsFn)

  function showToast(n: Notification) {
    const Icon = NOTIFICATION_ICONS[n.type]
    toast.custom(
      (id) => (
        <div className="relative flex w-[380px] items-start gap-3 rounded-2xl border border-[var(--corio-neutral-100)] bg-white p-4 pr-9 shadow-[0px_16px_40px_-8px_rgba(88,92,95,0.16)]">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--corio-neutral-100)] text-[var(--corio-blue-500)]">
            <Icon className="size-4" />
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(id)}
            className="absolute top-3 right-3 cursor-pointer text-[var(--corio-neutral-400)] hover:text-[var(--corio-neutral-600)]"
          >
            <X className="size-4" />
          </button>
          <div
            className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5"
            onClick={() => {
              toast.dismiss(id)
              if (!n.link) return
              const openQuery = n.type === 'query_raised' || n.type === 'query_response'
              navigate({ to: n.link, search: openQuery ? { openQuery: true } : undefined })
            }}
          >
            <p className="text-sm font-medium text-[var(--corio-neutral-800)]">{n.title}</p>
            <p className="text-sm text-[var(--corio-neutral-600)]">{n.body}</p>
          </div>
        </div>
      ),
      { duration: 5000, unstyled: true },
    )
  }

  async function checkForNew() {
    const notifications = await listNotifications()
    if (notifications.length === 0) return

    const latestCreatedAt = Math.max(...notifications.map((n) => new Date(n.createdAt).getTime()))
    const lastSeenAt = getLastSeenAt()

    if (lastSeenAt === null) {
      // First check this session — record the current high-water mark so
      // existing notifications don't all pop as "new".
      setLastSeenAt(latestCreatedAt)
      return
    }

    const fresh = notifications.filter((n) => new Date(n.createdAt).getTime() > lastSeenAt)
    if (fresh.length === 0) return

    setLastSeenAt(latestCreatedAt)
    playNotificationSound()
    for (const n of fresh) showToast(n)
  }

  useEffect(() => {
    checkForNew()
  }, [])

  usePoll(() => {
    checkForNew()
  }, 5000)

  return null
}
