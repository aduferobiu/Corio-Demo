import { X } from 'lucide-react'

import { StatusBadge, type LoanStatus } from '#/components/loans/status-badge'
import { formatDateTime } from '#/lib/loans/format'

const ROLE_LABELS: Record<string, string> = {
  loan_officer: 'Loan Officer',
  branch_officer: 'Branch Officer',
  credit_officer: 'Credit Officer',
  md: 'MD',
  admin: 'Admin',
}

type AuditEntry = {
  id: string
  fromStatus: string | null
  toStatus: string
  note: string | null
  createdAt: Date
  actorName: string
  actorRole: string
}

export function AuditTrailPanel({ open, onClose, entries }: { open: boolean; onClose: () => void; entries: AuditEntry[] }) {
  if (!open) return null

  return (
    <div className="fixed top-24 right-4 left-4 z-40 flex max-h-[80vh] w-auto max-w-[440px] flex-col overflow-hidden rounded-2xl border border-[var(--corio-neutral-200)] bg-white shadow-[0px_50px_100px_-20px_rgba(50,50,93,0.25),0px_30px_60px_-30px_rgba(0,0,0,0.3)] sm:left-auto sm:right-8 sm:w-[440px]">
      <div className="flex h-[58px] shrink-0 items-center justify-between bg-[#0c111d] px-5 py-4">
        <p className="text-base font-medium text-white">Audit Trail</p>
        <button type="button" onClick={onClose} className="text-white/70 hover:text-white">
          <X className="size-6" />
        </button>
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto px-5 py-4">
        {entries.length === 0 && <p className="py-6 text-center text-sm text-[var(--corio-neutral-400)]">No activity recorded yet.</p>}
        {entries.map((entry, i) => (
          <div key={entry.id} className="flex gap-3 pb-5">
            <div className="flex flex-col items-center pt-1">
              <span className="size-2 shrink-0 rounded-full bg-[var(--corio-blue-500)]" />
              {i < entries.length - 1 && <span className="mt-1 w-px flex-1 bg-[var(--corio-neutral-200)]" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pb-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {entry.fromStatus && (
                  <>
                    <StatusBadge status={entry.fromStatus as LoanStatus} />
                    <span className="text-[var(--corio-neutral-400)]">→</span>
                  </>
                )}
                <StatusBadge status={entry.toStatus as LoanStatus} />
              </div>
              <p className="text-xs text-[var(--corio-neutral-600)]">
                <span className="font-medium text-[var(--corio-neutral-800)]">{entry.actorName}</span>
                {' · '}
                {ROLE_LABELS[entry.actorRole] ?? entry.actorRole}
              </p>
              {entry.note && <p className="text-xs text-[var(--corio-neutral-500)] italic">"{entry.note}"</p>}
              <p className="text-[11px] text-[var(--corio-neutral-400)]">{formatDateTime(entry.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
