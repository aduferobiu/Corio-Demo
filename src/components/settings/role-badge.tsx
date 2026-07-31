import type { Role } from '#/lib/auth/types'
import { cn } from '#/lib/utils'

export const ROLE_LABELS: Record<Role, string> = {
  loan_officer: 'Loan Officer',
  branch_officer: 'Branch Officer',
  credit_officer: 'Credit Officer',
  md: 'MD',
  admin: 'Admin',
}

const ROLE_STYLES: Record<Role, string> = {
  loan_officer: 'border-[var(--corio-blue-500)] text-[var(--corio-blue-600)]',
  branch_officer: 'border-[var(--corio-purple-darker)] text-[var(--corio-purple-darker)]',
  credit_officer: 'border-[var(--corio-yellow-darker)] text-[var(--corio-yellow-darker)]',
  md: 'border-[var(--corio-green-600)] text-[var(--corio-green-600)]',
  admin: 'border-[var(--corio-neutral-400)] text-[var(--corio-neutral-500)]',
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center justify-center rounded-full border bg-white px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        ROLE_STYLES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
