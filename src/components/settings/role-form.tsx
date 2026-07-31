import { useState } from 'react'
import { X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { PERMISSION_GROUPS } from '#/lib/settings/permissions'

export type RoleFormValue = { name: string; permissions: string[] }

export function RoleForm({
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit'
  initial?: RoleFormValue
  onClose: () => void
  onSubmit: (value: RoleFormValue) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set(initial?.permissions ?? []))
  const [submitting, setSubmitting] = useState(false)

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleGroup(groupKeys: string[], allSelected: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const key of groupKeys) {
        if (allSelected) next.delete(key)
        else next.add(key)
      }
      return next
    })
  }

  const canSubmit = name.trim().length > 0 && selected.size > 0 && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), permissions: [...selected] })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 border-b border-[var(--corio-neutral-100)] pb-4">
        <button type="button" onClick={onClose} className="flex items-center gap-1 text-sm text-[var(--corio-neutral-600)] hover:text-[var(--corio-neutral-900)]">
          <X className="size-4" />
          Close
        </button>
        <p className="flex-1 text-center text-sm font-semibold text-[var(--corio-neutral-900)]">
          {mode === 'create' ? 'New Roles' : 'Edit Role'}
        </p>
        <div className="w-[52px]" />
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label>Role Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter a name for the role" />
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">Permissions</p>

          {PERMISSION_GROUPS.map((group) => {
            const groupKeys = group.permissions.map((p) => p.key)
            const allSelected = groupKeys.every((k) => selected.has(k))
            return (
              <div key={group.key} className="flex flex-col gap-3 rounded-xl bg-[var(--corio-neutral-100)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--corio-neutral-800)]">{group.label}</p>
                  <label className="flex items-center gap-1.5 text-xs text-[var(--corio-neutral-500)]">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleGroup(groupKeys, allSelected)}
                      className="size-3.5 rounded border-[var(--corio-neutral-300)] accent-[var(--corio-blue-500)]"
                    />
                    Select All
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {group.permissions.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 text-sm text-[var(--corio-neutral-700)]">
                      <input
                        type="checkbox"
                        checked={selected.has(perm.key)}
                        onChange={() => toggle(perm.key)}
                        className="size-3.5 rounded border-[var(--corio-neutral-300)] accent-[var(--corio-blue-500)]"
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-fit self-end">
          {submitting ? 'Saving…' : mode === 'create' ? 'Create Role' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
