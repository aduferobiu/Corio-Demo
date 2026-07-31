import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Bell, FileCheck2, FileUp, MessageSquareText, TrendingUp } from 'lucide-react'

import { formatElapsed } from '#/lib/loans/format'
import {
  listNotificationsFn,
  markAllNotificationsReadFn,
  markNotificationReadFn,
} from '#/lib/notifications/notifications.functions'
import { cn } from '#/lib/utils'

type Notification = Awaited<ReturnType<typeof listNotificationsFn>>[number]

const ICONS: Record<Notification['type'], typeof MessageSquareText> = {
  query_raised: MessageSquareText,
  query_response: MessageSquareText,
  document_upload_request: FileUp,
  document_decision: FileCheck2,
  loan_activity: TrendingUp,
}

export function NotificationBell() {
  const navigate = useNavigate()
  const listNotifications = useServerFn(listNotificationsFn)
  const markRead = useServerFn(markNotificationReadFn)
  const markAllRead = useServerFn(markAllNotificationsReadFn)

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const [items, setItems] = useState<Notification[]>([])

  useEffect(() => {
    listNotifications().then(setItems)
  }, [])

  const unreadCount = items.filter((n) => !n.read).length
  const visible = tab === 'unread' ? items.filter((n) => !n.read) : items

  async function handleOpenNotification(notification: Notification) {
    if (!notification.read) {
      await markRead({ data: { id: notification.id } })
      setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
    }
    setOpen(false)
    if (notification.link) navigate({ to: notification.link })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex cursor-pointer items-center rounded-full bg-[var(--corio-neutral-100)] p-2 text-[var(--corio-neutral-500)]"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-2 rounded-full bg-destructive" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-[calc(100%+8px)] right-0 z-50 flex max-h-[70vh] w-[380px] flex-col overflow-hidden rounded-2xl border border-[var(--corio-neutral-100)] bg-white shadow-[0px_16px_40px_-8px_rgba(88,92,95,0.16)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--corio-neutral-200)] px-5 py-4">
              <p className="text-lg font-semibold text-[var(--corio-neutral-900)]">Notifications</p>
              <div className="flex items-center gap-1 rounded-lg bg-[var(--corio-neutral-100)] p-1">
                {(['all', 'unread'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      'cursor-pointer rounded-md px-2.5 py-1 text-sm font-medium capitalize transition-colors',
                      tab === t ? 'bg-white text-[var(--corio-neutral-900)] shadow-sm' : 'text-[var(--corio-neutral-400)]',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto py-2">
              {visible.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-[var(--corio-neutral-400)]">
                  {tab === 'unread' ? "You're all caught up." : 'No notifications yet.'}
                </p>
              ) : (
                visible.map((notification) => {
                  const Icon = ICONS[notification.type]
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 px-5 py-3 text-left hover:bg-[var(--corio-neutral-100)]',
                        !notification.read && 'bg-[#eff4ff]/60',
                      )}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--corio-neutral-100)] text-[var(--corio-blue-500)]">
                        <Icon className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="text-sm font-medium text-[var(--corio-neutral-800)]">{notification.title}</p>
                        <p className="text-sm text-[var(--corio-neutral-600)]">{notification.body}</p>
                        <p className="text-xs text-[var(--corio-neutral-400)]">{formatElapsed(notification.createdAt)} ago</p>
                      </div>
                      {!notification.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--corio-blue-500)]" />}
                    </button>
                  )
                })
              )}
            </div>

            {unreadCount > 0 && (
              <div className="border-t border-[var(--corio-neutral-200)] px-5 py-3">
                <button
                  type="button"
                  onClick={async () => {
                    await markAllRead()
                    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
                  }}
                  className="cursor-pointer text-sm font-medium text-[var(--corio-blue-500)]"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
