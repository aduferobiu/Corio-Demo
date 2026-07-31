import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'

import { AppHeader } from '#/components/loans/app-header'
import { Sidebar } from '#/components/loans/sidebar'
import { StatCard } from '#/components/loans/stat-card'
import { StatusBadge, type LoanStatus } from '#/components/loans/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { getLoanOfficerDashboardFn } from '#/lib/loans/dashboard.functions'
import { formatElapsed, formatNaira } from '#/lib/loans/format'

export const Route = createFileRoute('/_authenticated/loan-officer/dashboard')({
  loader: () => getLoanOfficerDashboardFn(),
  component: LoanOfficerDashboard,
})

function LoanOfficerDashboard() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Dashboard" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Dashboard" />
        <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-6">
          {data.openQueries.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-[var(--corio-blue-light)]/40 p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[var(--corio-blue-darker)]" />
              <div className="flex flex-col gap-1 text-sm text-[var(--corio-blue-darker)]">
                <span className="font-medium">
                  {data.openQueries.length} application{data.openQueries.length === 1 ? '' : 's'} awaiting your response
                </span>
                <span className="flex flex-wrap items-center gap-x-1 opacity-90">
                  {data.openQueries.slice(0, 3).map((a, i) => (
                    <span key={a.id}>
                      <button
                        type="button"
                        className="underline underline-offset-2 hover:opacity-80"
                        onClick={() => navigate({ to: '/loan-officer/$applicationId', params: { applicationId: a.id } })}
                      >
                        {a.applicantName} ({a.referenceNumber})
                      </button>
                      {i < Math.min(data.openQueries.length, 3) - 1 ? ',' : ''}
                    </span>
                  ))}
                  {data.openQueries.length > 3 ? `, +${data.openQueries.length - 3} more` : ''}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-stretch gap-6">
            <StatCard label="Total Applications" value={String(data.totalApplications)} />
            <StatCard label="Pending Review" value={String(data.pendingReview)} />
            <StatCard label="Queries Needing Response" value={String(data.queriesNeedingResponse)} highlight={data.queriesNeedingResponse > 0} />
            <StatCard label="Approved" value={String(data.approved)} />
            <StatCard label="Declined" value={String(data.declined)} />
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--corio-neutral-100)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
                  <TableHead>Applicant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Elapsed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.applications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-[var(--corio-neutral-400)]">
                      You haven't submitted any loan applications yet.
                    </TableCell>
                  </TableRow>
                )}
                {data.applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: '/loan-officer/$applicationId', params: { applicationId: app.id } })}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--corio-neutral-100)] text-xs font-medium text-[var(--corio-neutral-600)]">
                          {app.applicantName
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
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
        </main>
      </div>
    </div>
  )
}
