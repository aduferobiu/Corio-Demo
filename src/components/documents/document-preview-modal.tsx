import { useEffect, useRef, useState } from 'react'
import { FileText, X } from 'lucide-react'

// Chrome's built-in <iframe> PDF viewer follows the OS/browser color scheme
// and can't be forced light from the embedding page — on a system with dark
// mode on, plain PDFs often render as a near-black, unreadable page. Rendering
// with pdfjs-dist onto a canvas we control sidesteps that entirely.
function PdfPreview({ dataUrl, name }: { dataUrl: string; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    async function render() {
      try {
        const [pdfjsLib, workerUrlModule] = await Promise.all([
          import('pdfjs-dist'),
          import('pdfjs-dist/build/pdf.worker.mjs?url'),
        ])
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrlModule.default

        const base64 = dataUrl.split(',')[1]
        if (!base64) throw new Error('No file content to preview')
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

        const doc = await pdfjsLib.getDocument({ data: bytes }).promise
        if (cancelled || !container) return

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          const page = await doc.getPage(pageNum)
          const viewport = page.getViewport({ scale: 1.5 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.className = 'mx-auto mb-3 max-w-full shadow-[0px_2px_8px_0px_rgba(27,28,29,0.08)] last:mb-0'
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
          if (cancelled) return
          container.appendChild(canvas)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to render this PDF')
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [dataUrl])

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-white text-destructive">
          <FileText className="size-8" />
        </div>
        <p className="max-w-[240px] truncate text-sm font-medium text-[var(--corio-neutral-700)]">{name}</p>
        <p className="text-xs text-[var(--corio-neutral-400)]">{error}</p>
        <a href={dataUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-[#155eef] underline">
          Open file
        </a>
      </div>
    )
  }

  return <div ref={containerRef} className="size-full overflow-y-auto py-2" />
}

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
            <PdfPreview dataUrl={dataUrl} name={name} />
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
