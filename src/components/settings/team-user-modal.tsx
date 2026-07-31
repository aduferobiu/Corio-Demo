import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import { ROLES, type Role } from '#/lib/auth/types'
import { ROLE_LABELS } from '#/components/settings/role-badge'

export type TeamUserFormValue = { name: string; email: string; role: Role | '' }

export function TeamUserModal({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initial?: TeamUserFormValue
  onSubmit: (value: { name: string; email: string; role: Role }) => Promise<void>
}) {
  const [form, setForm] = useState<TeamUserFormValue>(initial ?? { name: '', email: '', role: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setForm(initial ?? { name: '', email: '', role: '' })
  }, [open, initial])

  const canSubmit = form.name.trim().length > 0 && form.email.trim().length > 0 && form.role !== '' && !submitting

  async function handleSubmit() {
    if (!canSubmit || form.role === '') return
    setSubmitting(true)
    try {
      await onSubmit({ name: form.name.trim(), email: form.email.trim(), role: form.role })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] gap-5 rounded-2xl p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold text-[var(--corio-neutral-900)]">
            {mode === 'create' ? 'New User' : 'Edit User'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Enter user's name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email Address</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Enter email address"
              disabled={mode === 'edit'}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <NativeSelect value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}>
              <option value="">Select Role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
          {submitting ? 'Saving…' : mode === 'create' ? 'Add User' : 'Save Changes'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
