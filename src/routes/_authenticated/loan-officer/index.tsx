import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'

import { AppHeader } from '#/components/loans/app-header'
import { Sidebar } from '#/components/loans/sidebar'
import { StatusBadge, type LoanStatus } from '#/components/loans/status-badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { listMyApplicationsFn } from '#/lib/loans/loans.functions'

export const Route = createFileRoute('/_authenticated/loan-officer/')({
  loader: () => listMyApplicationsFn(),
  component: LoanOfficerIndex,
})

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

function LoanOfficerIndex() {
  const applications = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Loan" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Loan Application" />
        <main className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="relative w-[346px]">
              <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[var(--corio-neutral-400)]" />
              <Input placeholder="Search by applicant" className="h-[38px] pl-10" />
            </div>
            <Button onClick={() => navigate({ to: '/loan-officer/new' })}>
              <Plus className="size-5" />
              New Loan Application
            </Button>
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
              <span>Showing {applications.length} of {applications.length}</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
