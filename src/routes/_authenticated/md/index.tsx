import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { AppHeader } from '#/components/loans/app-header'
import { ManagementDashboardView } from '#/components/loans/management-dashboard'
import { Sidebar } from '#/components/loans/sidebar'
import { getManagementDashboardFn } from '#/lib/loans/dashboard.functions'

export const Route = createFileRoute('/_authenticated/md/')({
  loader: () => getManagementDashboardFn(),
  component: MdDashboard,
})

function MdDashboard() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Dashboard" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Dashboard" />
        <main className="flex flex-1 flex-col overflow-y-auto px-8 py-6">
          <ManagementDashboardView
            data={data}
            role="md"
            onRowClick={(applicationId) => navigate({ to: '/md/$applicationId', params: { applicationId } })}
          />
        </main>
      </div>
    </div>
  )
}
