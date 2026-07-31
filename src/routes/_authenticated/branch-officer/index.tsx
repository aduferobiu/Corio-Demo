import { createFileRoute } from '@tanstack/react-router'

import { AppHeader } from '#/components/loans/app-header'
import { DashboardDateFilter } from '#/components/loans/dashboard-date-filter'
import { ManagementDashboardView } from '#/components/loans/management-dashboard'
import { Sidebar } from '#/components/loans/sidebar'
import { getManagementDashboardFn } from '#/lib/loans/dashboard.functions'
import { validateDashboardRangeSearch } from '#/lib/loans/date-range'

export const Route = createFileRoute('/_authenticated/branch-officer/')({
  validateSearch: validateDashboardRangeSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getManagementDashboardFn({ data: deps }),
  component: BranchOfficerDashboard,
})

function BranchOfficerDashboard() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Dashboard" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Dashboard" />
        <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-6">
          <DashboardDateFilter value={search} onChange={(next) => navigate({ search: () => next, replace: true })} />
          <ManagementDashboardView
            data={data}
            role="branch_officer"
            onRowClick={(applicationId) => navigate({ to: '/branch-officer/$applicationId', params: { applicationId } })}
            onAlertClick={(applicationId) => navigate({ to: '/branch-officer/$applicationId', params: { applicationId } })}
          />
        </main>
      </div>
    </div>
  )
}
