import { useState } from 'react'

import { FileUploadArea } from '#/components/loans/file-upload-area'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'

const FOLDERS = [
  { value: 'general', label: 'General' },
  { value: 'loans', label: 'Loans' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'hr', label: 'HR' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'reports', label: 'Reports' },
] as const

export function NewDocumentModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (form: { name: string; folder: string; file: File }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [folder, setFolder] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setName('')
    setFolder('')
    setFile(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  async function handleSubmit() {
    if (!name.trim() || !file) return
    setSubmitting(true)
    try {
      await onCreate({ name: name.trim(), folder: folder || 'general', file })
      handleOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => handleOpenChange(false)}>
      <div className="flex w-[460px] max-w-full flex-col gap-5 rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--corio-neutral-900)]">New Document</h2>
          <p className="text-sm text-[var(--corio-neutral-400)]">Add a new document here</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Document Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter document name" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Folder</Label>
          <NativeSelect value={folder} onChange={(e) => setFolder(e.target.value)}>
            <option value="">Select Folder</option>
            {FOLDERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <FileUploadArea file={file} onSelect={setFile} onRemove={() => setFile(null)} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !file}>
            {submitting ? 'Creating…' : 'Create Document'}
          </Button>
        </div>
      </div>
    </div>
  )
}
