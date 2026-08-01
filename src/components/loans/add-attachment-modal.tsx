import { useState } from 'react'

import { FileUploadArea } from '#/components/loans/file-upload-area'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import { ATTACHMENT_TYPES } from '#/lib/loans/attachment-types'

export function AddAttachmentModal({
  open,
  onOpenChange,
  onUpload,
  existingTypes = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (documentType: string, file: File) => Promise<void>
  existingTypes?: string[]
}) {
  const availableTypes = ATTACHMENT_TYPES.filter((type) => !existingTypes.includes(type))
  const [documentType, setDocumentType] = useState<string>(availableTypes[0])
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFile(null)
      setDocumentType(availableTypes[0])
    }
    onOpenChange(next)
  }

  async function handleSubmit() {
    if (!file || !documentType) return
    setSubmitting(true)
    try {
      await onUpload(documentType, file)
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
          <h2 className="text-lg font-semibold text-[var(--corio-neutral-900)]">Add Attachment</h2>
          <p className="text-sm text-[var(--corio-neutral-400)]">Attach a document that wasn't added when this application was created</p>
        </div>

        {availableTypes.length === 0 ? (
          <p className="text-sm text-[var(--corio-neutral-400)]">All document types have already been attached to this application.</p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Document Type</Label>
              <NativeSelect value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <FileUploadArea file={file} onSelect={setFile} onRemove={() => setFile(null)} />
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !file || !documentType}>
            {submitting ? 'Saving…' : 'Save Attachment'}
          </Button>
        </div>
      </div>
    </div>
  )
}
