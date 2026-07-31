import { createFileRoute, redirect } from '@tanstack/react-router'

import { ROLE_DASHBOARD_HOME } from '#/lib/auth/role-routes'

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: ({ context }) => {
    throw redirect({ to: ROLE_DASHBOARD_HOME[context.user!.role] ?? '/login' })
  },
})
