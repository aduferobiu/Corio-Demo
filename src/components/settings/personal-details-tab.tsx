import { useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { getAvatarColor, getInitials } from '#/components/initials-avatar'
import type { AuthUser } from '#/lib/auth/types'
import { updateProfileFn } from '#/lib/settings/profile.functions'

export function PersonalDetailsTab({ user }: { user: AuthUser }) {
  const router = useRouter()
  const updateProfile = useServerFn(updateProfileFn)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? undefined)
  const [saving, setSaving] = useState(false)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile({ data: { name, email, avatarUrl } })
      await router.invalidate()
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col divide-y divide-[var(--corio-neutral-100)] rounded-2xl border border-[var(--corio-neutral-200)] bg-white p-6">
        <div className="pb-6">
          <p className="text-base font-semibold text-[var(--corio-neutral-900)]">Personal info</p>
          <p className="text-sm text-[var(--corio-neutral-400)]">Update your photo and personal details here.</p>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 py-6 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-[var(--corio-neutral-700)]">Name</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="sm:w-[360px]" />
        </div>

        <div className="flex flex-col items-start justify-between gap-2 py-6 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-[var(--corio-neutral-700)]">Email Address</p>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="sm:w-[360px]" />
        </div>

        <div className="flex flex-col items-start justify-between gap-3 pt-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-[var(--corio-neutral-700)]">Profile Photo</p>
            <p className="text-sm text-[var(--corio-neutral-400)]">This will be displayed on your profile.</p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="text-white" style={{ backgroundColor: getAvatarColor(name || user.name) }}>
                {getInitials(name || user.name)}
              </AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload Photo
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || !name.trim() || !email.trim()} className="w-fit">
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  )
}
