import { FileText, X } from 'lucide-react'

export function DocumentPreviewModal({
  name,
  dataUrl,
  mimeType,
  onClose,
}: {
  name: string
  dataUrl: string | null
  mimeType: string | null
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="flex h-[600px] w-[720px] max-w-full flex-col overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--corio-neutral-100)] px-6">
          <p className="truncate text-sm font-medium text-[var(--corio-neutral-900)]">{name}</p>
          <button type="button" onClick={onClose} className="text-[var(--corio-neutral-400)] hover:text-[var(--corio-neutral-900)]">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center bg-[var(--corio-neutral-100)] p-6">
          {mimeType?.startsWith('image/') && dataUrl ? (
            <img src={dataUrl} alt={name} className="max-h-full max-w-full rounded-lg object-contain" />
          ) : mimeType === 'application/pdf' && dataUrl ? (
            <iframe src={dataUrl} title={name} className="size-full rounded-lg border border-[var(--corio-neutral-200)] bg-white" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-white text-destructive">
                <FileText className="size-8" />
              </div>
              <p className="max-w-[240px] truncate text-sm font-medium text-[var(--corio-neutral-700)]">{name}</p>
              {dataUrl && (
                <a href={dataUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-[#155eef] underline">
                  Open file
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
