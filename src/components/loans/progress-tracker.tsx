import { Check } from 'lucide-react'

import { cn } from '#/lib/utils'

const STEPS = ['Applicant Information', 'Loan Details', 'Supporting Document'] as const
export type WizardStep = (typeof STEPS)[number]

export function ProgressTracker({ current }: { current: WizardStep }) {
  const currentIndex = STEPS.indexOf(current)

  return (
    <div className="flex w-full items-start">
      {STEPS.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        return (
          <div key={step} className={cn('flex flex-1 flex-col items-center gap-2', index === 0 && 'items-start', index === STEPS.length - 1 && 'items-end')}>
            <div className="flex h-6 w-full items-center gap-[3px]">
              {index > 0 && <div className="h-[3px] flex-1 bg-[var(--corio-neutral-200)]" />}
              {done ? (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--corio-blue-500)] text-white">
                  <Check className="size-3.5" />
                </div>
              ) : (
                <div
                  className={cn(
                    'size-3 shrink-0 rounded-full',
                    active ? 'bg-[var(--corio-blue-500)]' : 'bg-[var(--corio-neutral-300)]',
                  )}
                />
              )}
              {index < STEPS.length - 1 && <div className="h-[3px] flex-1 bg-[var(--corio-neutral-200)]" />}
            </div>
            <p className={cn('text-xs font-medium whitespace-nowrap', active || done ? 'text-[var(--corio-neutral-900)]' : 'text-[var(--corio-neutral-500)]')}>
              {step}
            </p>
          </div>
        )
      })}
    </div>
  )
}
