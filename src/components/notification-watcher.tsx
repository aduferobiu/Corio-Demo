import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
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
    toast(n.title, {
      description: n.body,
      duration: 5000,
      icon: <Icon className="size-4 text-[var(--corio-blue-500)]" />,
      action: n.link
        ? {
            label: 'View',
            onClick: () => navigate({ to: n.link! }),
          }
        : undefined,
    })
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
