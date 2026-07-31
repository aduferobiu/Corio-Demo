import { Bell, HelpCircle, ListChecks, RefreshCw } from 'lucide-react'

export function AppHeader({ title }: { title: string }) {
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[var(--corio-neutral-100)] bg-white px-6">
      <h1 className="font-['Inter_Display:Medium'] text-2xl font-medium text-[var(--corio-neutral-800)]">{title}</h1>
      <div className="flex items-center gap-2">
        {[RefreshCw, ListChecks, HelpCircle, Bell].map((Icon, i) => (
          <div key={i} className="flex items-center rounded-full bg-[var(--corio-neutral-100)] p-2 text-[var(--corio-neutral-500)]">
            <Icon className="size-5" />
          </div>
        ))}
      </div>
    </header>
  )
}
