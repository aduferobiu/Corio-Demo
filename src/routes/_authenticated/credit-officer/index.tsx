import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { InitialsAvatar } from '#/components/initials-avatar'
import { AppHeader } from '#/components/loans/app-header'
import { Sidebar } from '#/components/loans/sidebar'
import { StatusBadge, type LoanStatus } from '#/components/loans/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { formatNaira, formatQueueDuration } from '#/lib/loans/format'
import { getCreditStatsFn, listCreditQueueFn } from '#/lib/loans/loans.functions'

export const Route = createFileRoute('/_authenticated/credit-officer/')({
  loader: async () => {
    const [queue, stats] = await Promise.all([listCreditQueueFn(), getCreditStatsFn()])
    return { queue, stats }
  },
  component: CreditOfficerIndex,
})

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 rounded-2xl border border-[var(--corio-neutral-200)] bg-white p-6">
      <p className="text-sm text-[var(--corio-neutral-500)]">{label}</p>
      <p className="text-2xl font-bold text-[var(--corio-neutral-900)]">{value}</p>
    </div>
  )
}

function CreditOfficerIndex() {
  const { queue, stats } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Loan" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Loan Application" />
        <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-6">
          <div className="flex items-stretch gap-6">
            <StatCard label="Total Amount" value={formatNaira(stats.totalAmount)} />
            <StatCard label="Total No. Approved Loan" value={String(stats.totalApproved)} />
            <StatCard label="Total No. Declined Loan" value={String(stats.totalDeclined)} />
            <StatCard label="Total No. Pending Loan" value={String(stats.totalPending)} />
          </div>

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
                {queue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-[var(--corio-neutral-400)]">
                      No applications awaiting credit review.
                    </TableCell>
                  </TableRow>
                )}
                {queue.map((app) => (
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
                    <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatQueueDuration(app.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t border-[var(--corio-neutral-100)] px-6 py-3.5 text-sm text-[var(--corio-neutral-500)]">
              <span>
                Showing {queue.length} of {queue.length}
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
