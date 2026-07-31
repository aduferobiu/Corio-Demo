import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Check, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'
import { changePasswordFn } from '#/lib/settings/profile.functions'

const RULES = [
  { key: 'uppercase', label: 'At least 1 uppercase', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'number', label: 'At least 1 number', test: (v: string) => /[0-9]/.test(v) },
  { key: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
]

function strengthOf(password: string) {
  const metCount = RULES.filter((r) => r.test(password)).length
  if (metCount <= 1) return { label: 'Weak', color: 'bg-[var(--corio-red-darker,#dc2626)]', metCount }
  if (metCount === 2) return { label: 'Moderate', color: 'bg-orange-500', metCount }
  return { label: 'Strong', color: 'bg-[var(--corio-green-600)]', metCount }
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col items-start justify-between gap-2 py-6 first:pt-0 sm:flex-row sm:items-center">
      <p className="text-sm font-medium text-[var(--corio-neutral-700)]">{label}</p>
      <div className="relative sm:w-[360px]">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--corio-neutral-400)]"
          tabIndex={-1}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}

export function PasswordTab() {
  const changePassword = useServerFn(changePasswordFn)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const strength = strengthOf(newPassword)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
  const canSubmit = currentPassword.length > 0 && strength.metCount === 3 && passwordsMatch && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await changePassword({ data: { currentPassword, newPassword } })
      toast.success('Password Updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col divide-y divide-[var(--corio-neutral-100)] rounded-2xl border border-[var(--corio-neutral-200)] bg-white p-6">
        <div className="pb-6">
          <p className="text-base font-semibold text-[var(--corio-neutral-900)]">Password</p>
          <p className="text-sm text-[var(--corio-neutral-400)]">Please enter your current password to change your password.</p>
        </div>

        <PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />

        <div className="flex flex-col items-start justify-between gap-2 py-6 sm:flex-row sm:items-start">
          <p className="pt-2.5 text-sm font-medium text-[var(--corio-neutral-700)]">New password</p>
          <div className="flex flex-col gap-2 sm:w-[360px]">
            <div className="relative">
              <PasswordVisibilityInput value={newPassword} onChange={setNewPassword} />
            </div>
            {newPassword.length > 0 && (
              <>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={cn('h-1 flex-1 rounded-full bg-[var(--corio-neutral-100)]', i < strength.metCount && strength.color)}
                    />
                  ))}
                </div>
                <p className="text-xs text-[var(--corio-neutral-500)]">
                  {strength.label} password.{' '}
                  {strength.metCount === 3 ? 'Your password is secure.' : 'Must contain at least;'}
                </p>
                <div className="flex flex-col gap-1">
                  {RULES.map((rule) => {
                    const met = rule.test(newPassword)
                    return (
                      <div key={rule.key} className="flex items-center gap-1.5 text-xs">
                        <span
                          className={cn(
                            'flex size-3.5 shrink-0 items-center justify-center rounded-full',
                            met ? 'bg-[var(--corio-green-600)]' : 'border border-[var(--corio-neutral-300)]',
                          )}
                        >
                          {met && <Check className="size-2.5 text-white" />}
                        </span>
                        <span className={met ? 'text-[var(--corio-neutral-600)]' : 'text-[var(--corio-neutral-400)]'}>{rule.label}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
      </div>

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-fit">
        {submitting ? 'Updating…' : 'Update password'}
      </Button>
    </div>
  )
}

function PasswordVisibilityInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <Input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--corio-neutral-400)]"
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </>
  )
}
