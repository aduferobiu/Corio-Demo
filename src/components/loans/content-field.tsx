export function ContentField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">{label}</p>
      <p className="truncate text-sm text-[var(--corio-neutral-600)]">{value}</p>
    </div>
  )
}
