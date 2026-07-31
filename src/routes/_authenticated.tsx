import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { NotificationWatcher } from '#/components/notification-watcher'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: () => (
    <>
      <NotificationWatcher />
      <Outlet />
    </>
  ),
})
