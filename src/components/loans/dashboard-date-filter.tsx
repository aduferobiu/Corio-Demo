import { useState } from 'react'
import { Calendar, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import type { DashboardRangeInput, DashboardRangePreset } from '#/lib/loans/date-range'

const PRESETS: { value: Exclude<DashboardRangePreset, 'custom'>; label: string }[] = [
  { value: '12m', label: '12 Months' },
  { value: '30d', label: '30 Days' },
  { value: '7d', label: '7 days' },
]

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}

export function DashboardDateFilter({
  value,
  onChange,
}: {
  value: DashboardRangeInput
  onChange: (next: DashboardRangeInput) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(value.from ?? '')
  const [draftTo, setDraftTo] = useState(value.to ?? '')

  const isCustom = value.range === 'custom' && value.from

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="inline-flex items-center gap-1 rounded-[10px] border border-[var(--corio-neutral-200)] bg-white p-1">
        {PRESETS.map((p) => {
          const active = !isCustom && (value.range ?? '30d') === p.value
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange({ range: p.value })}
              className={
                'rounded-md px-3 py-1 text-sm font-medium transition-colors ' +
                (active
                  ? 'bg-[var(--corio-neutral-900)] text-white'
                  : 'text-[var(--corio-neutral-400)] hover:text-[var(--corio-neutral-600)]')
              }
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {isCustom && value.from ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--corio-neutral-200)] bg-white px-3 py-2 text-sm text-[var(--corio-neutral-600)] shadow-[0px_1px_2px_0px_rgba(82,88,102,0.06)]">
          <Calendar className="size-4 text-[var(--corio-neutral-400)]" />
          {formatShortDate(value.from)} - {formatShortDate(value.to ?? value.from)}
          <button type="button" onClick={() => onChange({ range: '30d' })} className="text-[var(--corio-neutral-400)] hover:text-[var(--corio-neutral-700)]">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraftFrom(value.from ?? '')
            setDraftTo(value.to ?? '')
            setPickerOpen(true)
          }}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--corio-neutral-200)] bg-white px-3 py-2 text-sm font-medium text-[var(--corio-neutral-600)] shadow-[0px_1px_2px_0px_rgba(82,88,102,0.06)] hover:bg-[var(--corio-neutral-100)]"
        >
          <Calendar className="size-4" />
          Select Date
        </button>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setPickerOpen(false)}>
          <div className="flex w-[360px] max-w-full flex-col gap-5 rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-semibold text-[var(--corio-neutral-900)]">Select date range</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>From</Label>
                <Input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>To</Label>
                <Input type="date" value={draftTo} min={draftFrom || undefined} onChange={(e) => setDraftTo(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setPickerOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!draftFrom || !draftTo}
                onClick={() => {
                  onChange({ range: 'custom', from: draftFrom, to: draftTo })
                  setPickerOpen(false)
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
