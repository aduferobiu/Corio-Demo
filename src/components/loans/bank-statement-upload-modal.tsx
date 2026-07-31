import { useState } from 'react'

import { FileUploadArea } from '#/components/loans/file-upload-area'
import { Button } from '#/components/ui/button'

export function BankStatementUploadModal({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (file: File) => Promise<void>
}) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleOpenChange(next: boolean) {
    if (!next) setFile(null)
    onOpenChange(next)
  }

  async function handleSubmit() {
    if (!file) return
    setSubmitting(true)
    try {
      await onUpload(file)
      handleOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => handleOpenChange(false)}>
      <div className="flex w-[460px] max-w-full flex-col gap-5 rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="text-lg font-semibold text-[var(--corio-neutral-900)]">New Bank Statement</h2>
          <p className="text-sm text-[var(--corio-neutral-400)]">Replace or update any document in this view</p>
        </div>

        <FileUploadArea file={file} onSelect={setFile} onRemove={() => setFile(null)} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !file}>
            {submitting ? 'Saving…' : 'Save Statement'}
          </Button>
        </div>
      </div>
    </div>
  )
}
