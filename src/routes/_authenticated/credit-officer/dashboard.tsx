import { createFileRoute } from '@tanstack/react-router'

import { InitialsAvatar } from '#/components/initials-avatar'
import { AppHeader } from '#/components/loans/app-header'
import { DashboardDateFilter } from '#/components/loans/dashboard-date-filter'
import { Sidebar } from '#/components/loans/sidebar'
import { StatCard } from '#/components/loans/stat-card'
import { StatusBadge, type LoanStatus } from '#/components/loans/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { getCreditOfficerDashboardFn } from '#/lib/loans/dashboard.functions'
import { validateDashboardRangeSearch } from '#/lib/loans/date-range'
import { formatElapsed, formatHours, formatNaira, formatTime } from '#/lib/loans/format'

export const Route = createFileRoute('/_authenticated/credit-officer/dashboard')({
  validateSearch: validateDashboardRangeSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getCreditOfficerDashboardFn({ data: deps }),
  component: CreditOfficerDashboard,
})

function CreditOfficerDashboard() {
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

          <div className="flex items-stretch gap-6">
            <StatCard label="Awaiting Your Review" value={String(data.awaitingReview.length)} highlight={data.awaitingReview.length > 0} />
            <StatCard label="Approved This Month" value={String(data.approvedThisMonth)} />
            <StatCard label="Declined This Month" value={String(data.declinedThisMonth)} />
            <StatCard label="Avg Decision Time" value={formatHours(data.avgDecisionHours)} />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-[var(--corio-neutral-900)]">Review Queue (oldest first)</h2>
            <div className="overflow-hidden rounded-lg border border-[var(--corio-neutral-100)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
                    <TableHead>Applicant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Queue Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.awaitingReview.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-[var(--corio-neutral-400)]">
                        No applications awaiting credit review.
                      </TableCell>
                    </TableRow>
                  )}
                  {data.awaitingReview.map((app) => (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ to: '/credit-officer/$applicationId', params: { applicationId: app.id } })}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <InitialsAvatar name={app.applicantName} className="size-8 text-xs font-medium" />
                          <span className="text-sm font-medium text-[var(--corio-neutral-800)]">{app.applicantName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatNaira(app.amountRequested)}</TableCell>
                      <TableCell>
                        <StatusBadge status={app.status as LoanStatus} />
                      </TableCell>
                      <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatElapsed(app.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-[var(--corio-neutral-900)]">Actioned Today</h2>
            <div className="overflow-hidden rounded-lg border border-[var(--corio-neutral-100)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
                    <TableHead>Applicant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.actionedToday.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-[var(--corio-neutral-400)]">
                        Nothing actioned yet today.
                      </TableCell>
                    </TableRow>
                  )}
                  {data.actionedToday.map((app) => (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ to: '/credit-officer/$applicationId', params: { applicationId: app.id } })}
                    >
                      <TableCell className="text-sm font-medium text-[var(--corio-neutral-800)]">{app.applicantName}</TableCell>
                      <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatNaira(app.amountRequested)}</TableCell>
                      <TableCell>
                        <StatusBadge status={app.status as LoanStatus} />
                      </TableCell>
                      <TableCell className="text-sm text-[var(--corio-neutral-800)]">{app.decidedAt ? formatTime(app.decidedAt) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
