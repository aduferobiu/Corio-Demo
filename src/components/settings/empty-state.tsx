import { Inbox } from 'lucide-react'

import { Button } from '#/components/ui/button'

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--corio-neutral-100)]">
        <Inbox className="size-6 text-[var(--corio-neutral-400)]" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[var(--corio-neutral-900)]">{title}</p>
        <p className="text-sm text-[var(--corio-neutral-400)]">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
