import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'

import { InitialsAvatar } from '#/components/initials-avatar'
import { AppHeader } from '#/components/loans/app-header'
import { Sidebar } from '#/components/loans/sidebar'
import { StatusBadge, type LoanStatus } from '#/components/loans/status-badge'
import { Input } from '#/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { formatDate, formatNaira } from '#/lib/loans/format'
import { listCreditApplicationsFn } from '#/lib/loans/loans.functions'

export const Route = createFileRoute('/_authenticated/credit-officer/')({
  loader: () => listCreditApplicationsFn(),
  component: CreditOfficerIndex,
})

function CreditOfficerIndex() {
  const applications = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Loan" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Loan Application" />
        <main className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-8 py-6">
          <div className="relative w-[346px]">
            <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[var(--corio-neutral-400)]" />
            <Input placeholder="Search by applicant" className="h-[38px] pl-10" />
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--corio-neutral-100)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
                  <TableHead>Applicant</TableHead>
                  <TableHead>BVN</TableHead>
                  <TableHead>Loan</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-[var(--corio-neutral-400)]">
                      No loan applications yet.
                    </TableCell>
                  </TableRow>
                )}
                {applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: '/credit-officer/$applicationId', params: { applicationId: app.id } })}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <InitialsAvatar name={app.applicantName} className="size-8 text-xs font-medium" />
                        <div className="flex flex-col">
                          <span className="max-w-[120px] truncate text-sm font-medium text-[var(--corio-neutral-800)]">{app.applicantName}</span>
                          <span className="text-xs text-[var(--corio-neutral-400)]">{app.applicantPhone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--corio-neutral-800)]">{app.bvn ?? '—'}</TableCell>
                    <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatNaira(app.amountRequested)}</TableCell>
                    <TableCell className="text-sm text-[var(--corio-neutral-800)]">{app.monthlyIncome ? formatNaira(app.monthlyIncome) : '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={app.status as LoanStatus} />
                    </TableCell>
                    <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatDate(app.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t border-[var(--corio-neutral-100)] px-6 py-3.5 text-sm text-[var(--corio-neutral-500)]">
              <span>
                Showing {applications.length} of {applications.length}
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
