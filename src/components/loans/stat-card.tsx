import { cn } from '#/lib/utils'

export function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-1.5 rounded-2xl border p-6',
        highlight ? 'border-[var(--corio-yellow-darker)]/30 bg-[var(--corio-yellow-light)]/30' : 'border-[var(--corio-neutral-200)] bg-white',
      )}
    >
      <p className={cn('text-sm', highlight ? 'text-[var(--corio-yellow-darker)]' : 'text-[var(--corio-neutral-500)]')}>{label}</p>
      <p className={cn('text-2xl font-bold', highlight ? 'text-[var(--corio-yellow-darker)]' : 'text-[var(--corio-neutral-900)]')}>{value}</p>
    </div>
  )
}
