import { useRef, useState } from 'react'
import { FileText, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { DocumentPreviewContent } from '#/components/documents/document-preview-modal'
import { formatDate, formatTime } from '#/lib/loans/format'
import { cn } from '#/lib/utils'

type DocumentDetail = {
  document: {
    id: string
    name: string
    folder: string
    status: 'pending' | 'approved' | 'rejected'
    ownerName: string
    approverName: string | null
    updatedAt: Date
  }
  versions: { id: string; version: number; fileName: string; mimeType: string; dataUrl: string | null; fileSize: number; uploaderName: string; createdAt: Date }[]
  activity: { id: string; action: string; actorName: string; createdAt: Date }[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--corio-yellow-light)] text-[var(--corio-yellow-darker)]',
  approved: 'bg-[var(--corio-green-light)] text-[var(--corio-green-darker)]',
  rejected: 'bg-[var(--corio-red-light)] text-[var(--corio-red-darker)]',
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Document created',
  uploaded_version: 'New version uploaded',
  approved: 'Document approved',
  rejected: 'Document rejected',
}

export function DocumentDetailModal({
  data,
  canDelete,
  onClose,
  onUploadNewVersion,
  onDelete,
}: {
  data: DocumentDetail
  canDelete: boolean
  onClose: () => void
  onUploadNewVersion: (file: File) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const { document: doc, versions, activity } = data
  const latest = versions[0]
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await onUploadNewVersion(file)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="flex h-[600px] w-[960px] max-w-full flex-col overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--corio-neutral-100)] px-6">
          <p className="text-sm font-medium text-[var(--corio-neutral-900)]">{doc.name}</p>
          <button type="button" onClick={onClose} className="text-[var(--corio-neutral-400)] hover:text-[var(--corio-neutral-900)]">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-[var(--corio-neutral-100)] p-6">
            <DocumentPreviewContent name={latest?.fileName ?? doc.name} dataUrl={latest?.dataUrl ?? null} mimeType={latest?.mimeType ?? null} />
          </div>

          <div className="flex w-[340px] shrink-0 flex-col border-l border-[var(--corio-neutral-100)]">
            <Tabs defaultValue="details" className="flex flex-1 flex-col overflow-hidden">
              <TabsList variant="line" className="h-10 shrink-0 gap-4 border-b border-[var(--corio-neutral-100)] px-5">
                <TabsTrigger value="details" className="px-1">
                  Details
                </TabsTrigger>
                <TabsTrigger value="versions" className="px-1">
                  Versions
                </TabsTrigger>
                <TabsTrigger value="activity" className="px-1">
                  Activity
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-5">
                <TabsContent value="details" className="mt-0">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                    <Field label="Owner" value={doc.ownerName} />
                    <Field label="Approver" value={doc.approverName ?? '—'} />
                    <Field label="Category" value={doc.folder} className="capitalize" />
                    <Field label="Folder" value={doc.folder} className="capitalize" />
                    <Field label="Last Updated" value={`${formatDate(doc.updatedAt)}, ${formatTime(doc.updatedAt)}`} />
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">Status</p>
                      <span className={cn('inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[doc.status])}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="versions" className="mt-0 flex flex-col gap-4">
                  {versions.map((v) => (
                    <div key={v.id} className="flex gap-2.5">
                      <div className="mt-0.5 size-2.5 shrink-0 rounded-full bg-[var(--corio-green-600)]" />
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-medium text-[var(--corio-neutral-900)]">
                          v{v.version} — {formatDate(v.createdAt)} · {formatTime(v.createdAt)}
                        </p>
                        <p className="text-xs text-[var(--corio-neutral-400)]">{v.version === 1 ? 'Initial upload' : 'New version uploaded'}</p>
                        <div className="flex items-center gap-2 rounded-lg border border-[var(--corio-neutral-200)] bg-white px-2.5 py-1.5">
                          <FileText className="size-3.5 shrink-0 text-destructive" />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-xs font-medium text-[var(--corio-neutral-900)]">{v.fileName}</span>
                            <span className="text-[10px] text-[var(--corio-neutral-400)]">uploaded by {v.uploaderName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="activity" className="mt-0 flex flex-col gap-4">
                  {activity.map((a) => (
                    <div key={a.id} className="flex gap-2.5">
                      <div className="mt-0.5 size-2.5 shrink-0 rounded-full bg-[var(--corio-green-600)]" />
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium text-[var(--corio-neutral-900)]">
                          {formatDate(a.createdAt)} · {formatTime(a.createdAt)}
                        </p>
                        <p className="text-xs text-[var(--corio-neutral-400)]">{ACTION_LABELS[a.action] ?? a.action}</p>
                        <p className="text-xs text-[var(--corio-neutral-500)]">{a.actorName}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--corio-neutral-100)] p-4">
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive text-destructive"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </Button>
              )}
              <Button size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? 'Uploading…' : 'Upload New Version'}
              </Button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">{label}</p>
      <p className={cn('truncate text-sm text-[var(--corio-neutral-700)]', className)}>{value}</p>
    </div>
  )
}
