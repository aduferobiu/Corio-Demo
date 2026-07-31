import { StatCard } from '#/components/loans/stat-card'
import { StatusBadge, type LoanStatus } from '#/components/loans/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { formatElapsed, formatHours, formatNaira } from '#/lib/loans/format'
import type { Role } from '#/lib/auth/types'
import type { getManagementDashboardFn } from '#/lib/loans/dashboard.functions'

type ManagementDashboardData = Awaited<ReturnType<typeof getManagementDashboardFn>>

export function ManagementDashboardView({
  data,
  onRowClick,
}: {
  data: ManagementDashboardData
  role: Role
  onRowClick?: (applicationId: string) => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-stretch gap-5">
        <StatCard label="Total Application" value={formatNaira(data.totalAmountRequested)} />
        <StatCard label="Pending Review" value={String(data.pendingReview)} />
        <StatCard label="Approved" value={String(data.approved)} />
        <StatCard label="Declined" value={String(data.declined)} />
        <StatCard label="Avg Processing Time" value={formatHours(data.avgProcessingHours)} />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-[var(--corio-neutral-200)] bg-white p-6">
        <h2 className="text-xl font-semibold text-[var(--corio-neutral-900)]">Live Application Pipeline</h2>
        <div className="overflow-hidden rounded-lg border border-[var(--corio-neutral-100)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
                <TableHead>Applicant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Time at stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pipeline.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-[var(--corio-neutral-400)]">
                    No loan applications yet.
                  </TableCell>
                </TableRow>
              )}
              {data.pipeline.map((app) => (
                <TableRow key={app.id} className={onRowClick ? 'cursor-pointer' : undefined} onClick={() => onRowClick?.(app.id)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[var(--corio-neutral-800)]">{app.applicantName}</span>
                      <span className="text-xs font-semibold text-[var(--corio-neutral-400)]">{app.referenceNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatNaira(app.amountRequested)}</TableCell>
                  <TableCell>
                    <StatusBadge status={app.status as LoanStatus} />
                  </TableCell>
                  <TableCell className="text-sm text-[var(--corio-neutral-800)]">{app.branch ?? '—'}</TableCell>
                  <TableCell className="text-sm text-[var(--corio-neutral-800)]">{app.assignedToName}</TableCell>
                  <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatElapsed(app.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="flex flex-1 flex-col gap-5 rounded-xl border border-[var(--corio-neutral-200)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[var(--corio-neutral-900)]">Staff Performance</h3>
          <div className="flex flex-col gap-4">
            {data.staffPerformance.length === 0 && <p className="text-xs text-[var(--corio-neutral-400)]">No activity yet.</p>}
            {data.staffPerformance.map((staff, i) => {
              const max = data.staffPerformance[0]?.count || 1
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <p className="w-[118px] shrink-0 truncate text-[11.5px] text-[var(--corio-neutral-500)]">{staff.name}</p>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--corio-neutral-100)]">
                    <div className="h-2.5 rounded-full bg-[#137a6c]" style={{ width: `${Math.max(6, (staff.count / max) * 100)}%` }} />
                  </div>
                  <p className="text-[11.5px] font-bold text-[var(--corio-neutral-900)]">{staff.count}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 rounded-xl border border-[var(--corio-neutral-200)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[var(--corio-neutral-900)]">Overdue Alerts</h3>
          <div className="flex flex-col gap-3">
            {data.overdueAlerts.length === 0 && <p className="text-xs text-[var(--corio-neutral-400)]">Nothing overdue right now.</p>}
            {data.overdueAlerts.map((alert) => {
              const overTarget = alert.hoursInStage >= alert.targetHours
              const stageLabel = alert.status === 'with_credit' ? 'Awaiting Credit Officer' : 'Query response outstanding'
              return (
                <div
                  key={alert.id}
                  className={`flex flex-col gap-1 rounded-xl px-3.5 pt-3.5 pb-4 text-sm ${
                    overTarget ? 'bg-[var(--corio-red-light)] text-[var(--corio-red-darker)]' : 'bg-[#ffdac2] text-[#6e330c]'
                  }`}
                >
                  <span className="font-medium">
                    {alert.applicantName} · {alert.referenceNumber}
                  </span>
                  <span className="opacity-90">
                    {stageLabel} for {formatHours(alert.hoursInStage)}
                    {overTarget
                      ? ` — exceeds the ${formatHours(alert.targetHours)} stage target by ${formatHours(alert.hoursInStage - alert.targetHours)}.`
                      : ` — approaching the ${formatHours(alert.targetHours)} stage target.`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
