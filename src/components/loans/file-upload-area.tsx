import { useRef, useState } from 'react'
import { FileText, Trash2, UploadCloud } from 'lucide-react'

import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL } from '#/lib/documents/limits'

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}b`
  return `${Math.round(bytes / 1024)}kb`
}

export function FileUploadArea({
  file,
  onSelect,
  onRemove,
}: {
  file: File | null
  onSelect: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  if (file) {
    return (
      <div className="flex w-full items-center justify-between rounded-xl bg-[var(--corio-neutral-100)] p-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--corio-blue-500)]">
            <FileText className="size-5" />
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-medium text-[var(--corio-neutral-900)]">{file.name}</p>
            <p className="text-xs text-[var(--corio-neutral-400)]">{formatFileSize(file.size)} · 100%</p>
          </div>
        </div>
        <button type="button" onClick={onRemove} className="shrink-0 text-[var(--corio-neutral-400)] hover:text-destructive">
          <Trash2 className="size-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-[var(--corio-neutral-300)] bg-white p-5 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,application/pdf,video/mp4"
          onChange={(e) => {
            const selected = e.target.files?.[0]
            e.target.value = ''
            if (!selected) return
            if (selected.size > MAX_FILE_SIZE_BYTES) {
              setError(`"${selected.name}" is too large. Maximum file size is ${MAX_FILE_SIZE_LABEL}.`)
              return
            }
            setError(null)
            onSelect(selected)
          }}
        />
        <div className="flex items-center gap-5">
          <UploadCloud className="size-6 shrink-0 text-[var(--corio-neutral-400)]" />
          <div className="flex flex-col gap-1 text-left">
            <p className="text-sm font-medium text-[var(--corio-neutral-900)]">Upload Document</p>
            <p className="text-xs text-[var(--corio-neutral-400)]">JPEG, PNG, PDF, and MP4 formats, up to {MAX_FILE_SIZE_LABEL}.</p>
          </div>
        </div>
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
