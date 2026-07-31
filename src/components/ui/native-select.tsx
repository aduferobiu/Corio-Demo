import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '#/lib/utils'

function NativeSelect({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative w-full">
      <select
        data-slot="native-select"
        className={cn(
          'h-[46px] w-full min-w-0 appearance-none rounded-[10px] border border-input bg-white px-3.5 py-3 pr-10 text-sm text-[var(--corio-neutral-900)] shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
          !props.value && 'text-muted-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-[var(--corio-neutral-400)]" />
    </div>
  )
}

export { NativeSelect }
