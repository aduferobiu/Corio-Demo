import { useRef, useState } from 'react'
import { FileText, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { DocumentPreviewModal } from '#/components/documents/document-preview-modal'
import { formatDate, formatTime } from '#/lib/loans/format'

type PendingDoc = {
  id: string
  name: string
  ownerName: string
  updatedAt: Date
  latestFileName: string | null
  latestDataUrl: string | null
  latestMimeType: string | null
  latestFileSize: number | null
}

export function PendingApprovalModal({
  open,
  onClose,
  documents,
  canDecide,
  onApprove,
  onReject,
  onBulkDecide,
  onUploadNewVersion,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  documents: PendingDoc[]
  canDecide: boolean
  onApprove: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
  onBulkDecide: (decision: 'approved' | 'rejected') => Promise<void>
  onUploadNewVersion: (id: string, file: File) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<PendingDoc | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-[420px] max-w-full flex-col bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--corio-neutral-100)] px-6">
          <p className="text-base font-semibold text-[var(--corio-neutral-900)]">Document Awaiting Approval</p>
          <button type="button" onClick={onClose} className="text-[var(--corio-neutral-400)] hover:text-[var(--corio-neutral-900)]">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          {documents.length === 0 && <p className="py-8 text-center text-sm text-[var(--corio-neutral-400)]">Nothing awaiting approval.</p>}
          {documents.map((doc) => (
            <div key={doc.id} className="flex flex-col gap-2 rounded-xl border border-[var(--corio-neutral-200)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--corio-neutral-100)] text-destructive">
                    <FileText className="size-4.5" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-[var(--corio-neutral-900)]">{doc.name}</span>
                    <span className="text-xs text-[var(--corio-neutral-400)]">
                      {doc.ownerName} · Filed {formatDate(doc.updatedAt)}, {formatTime(doc.updatedAt)}
                      {doc.latestFileSize ? ` · ${Math.round(doc.latestFileSize / 1024)}kb` : ''}
                    </span>
                  </div>
                </div>
                {doc.latestDataUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="shrink-0 text-xs font-medium text-[var(--corio-neutral-500)] underline"
                  >
                    Preview
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 pl-11.5">
                {canDecide ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === doc.id}
                      onClick={async () => {
                        setBusyId(doc.id)
                        try {
                          await onApprove(doc.id)
                        } finally {
                          setBusyId(null)
                        }
                      }}
                      className="text-xs font-medium text-[#155eef] underline disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === doc.id}
                      onClick={async () => {
                        setBusyId(doc.id)
                        try {
                          await onReject(doc.id)
                        } finally {
                          setBusyId(null)
                        }
                      }}
                      className="text-xs font-medium text-destructive underline disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busyId === doc.id}
                      onClick={() => fileInputRefs.current[doc.id]?.click()}
                      className="text-xs font-medium text-[#155eef] underline disabled:opacity-50"
                    >
                      Upload New Version
                    </button>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[doc.id] = el
                      }}
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setBusyId(doc.id)
                        try {
                          await onUploadNewVersion(doc.id, file)
                        } finally {
                          setBusyId(null)
                          e.target.value = ''
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={busyId === doc.id}
                      onClick={async () => {
                        setBusyId(doc.id)
                        try {
                          await onDelete(doc.id)
                        } finally {
                          setBusyId(null)
                        }
                      }}
                      className="text-xs font-medium text-destructive underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {canDecide && documents.length > 0 && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--corio-neutral-100)] p-4">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive"
              disabled={bulkBusy}
              onClick={async () => {
                setBulkBusy(true)
                try {
                  await onBulkDecide('rejected')
                } finally {
                  setBulkBusy(false)
                }
              }}
            >
              Reject All
            </Button>
            <Button
              size="sm"
              disabled={bulkBusy}
              onClick={async () => {
                setBulkBusy(true)
                try {
                  await onBulkDecide('approved')
                } finally {
                  setBulkBusy(false)
                }
              }}
            >
              {bulkBusy ? 'Working…' : 'Approve All'}
            </Button>
          </div>
        )}
      </div>

      {previewDoc && (
        <DocumentPreviewModal
          name={previewDoc.name}
          dataUrl={previewDoc.latestDataUrl}
          mimeType={previewDoc.latestMimeType}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  )
}
