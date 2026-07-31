import { cn } from '#/lib/utils'

export type LoanStatus = 'draft' | 'submitted' | 'queried' | 'with_credit' | 'approved' | 'declined' | 'rejected'

const STATUS_STYLES: Record<LoanStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-[var(--corio-neutral-100)] text-[var(--corio-neutral-500)]' },
  submitted: { label: 'Pending', className: 'bg-[var(--corio-yellow-light)] text-[var(--corio-yellow-darker)]' },
  queried: { label: 'Query Raised', className: 'bg-[var(--corio-blue-light)] text-[var(--corio-blue-darker)]' },
  with_credit: { label: 'Awaiting Credit Officer', className: 'bg-[var(--corio-purple-light)] text-[var(--corio-purple-darker)]' },
  approved: { label: 'Approved', className: 'bg-[var(--corio-green-light)] text-[var(--corio-green-darker)]' },
  declined: { label: 'Declined', className: 'bg-[var(--corio-red-light)] text-[var(--corio-red-darker)]' },
  rejected: { label: 'Rejected', className: 'bg-[var(--corio-red-light)] text-[var(--corio-red-darker)]' },
}

export function StatusBadge({ status, className }: { status: LoanStatus; className?: string }) {
  const { label, className: statusClassName } = STATUS_STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        statusClassName,
        className,
      )}
    >
      {label}
    </span>
  )
}
