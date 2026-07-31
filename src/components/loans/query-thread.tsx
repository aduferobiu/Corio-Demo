import { useRef, useState } from 'react'
import { FileText, Paperclip, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { formatTime } from '#/lib/loans/format'

const ROLE_LABELS: Record<string, string> = {
  loan_officer: 'Loan Officer',
  branch_officer: 'Branch Officer',
  credit_officer: 'Credit Officer',
  md: 'MD',
  admin: 'Admin',
}

type ThreadComment = {
  comment: { id: string; type: string; body: string; createdAt: Date }
  author: { name: string; role: string }
}

type ThreadAttachment = {
  id: string
  commentId: string | null
  fileName: string
  mimeType: string
  dataUrl: string | null
}

function AttachmentChip({ attachment }: { attachment: ThreadAttachment }) {
  const isImage = attachment.mimeType.startsWith('image/')
  if (isImage && attachment.dataUrl) {
    return (
      <a href={attachment.dataUrl} target="_blank" rel="noreferrer" className="mt-1.5 block w-fit">
        <img src={attachment.dataUrl} alt={attachment.fileName} className="max-h-32 max-w-full rounded-lg border border-[var(--corio-neutral-100)] object-cover" />
      </a>
    )
  }
  return (
    <a
      href={attachment.dataUrl ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 flex w-fit max-w-full items-center gap-1.5 rounded-lg border border-[var(--corio-neutral-200)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--corio-neutral-700)] shadow-[0px_1px_2px_0px_rgba(82,88,102,0.06)] hover:bg-[var(--corio-neutral-100)]"
    >
      <FileText className="size-3.5 shrink-0 text-destructive" />
      <span className="truncate">{attachment.fileName}</span>
    </a>
  )
}

export function QueryThreadPanel({
  open,
  onClose,
  comments,
  attachments = [],
  canWrite,
  onSend,
}: {
  open: boolean
  onClose: () => void
  comments: ThreadComment[]
  attachments?: ThreadAttachment[]
  canWrite?: boolean
  onSend?: (body: string, file: File | null) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  async function handleSubmit() {
    if (!draft.trim() || !onSend) return
    setSubmitting(true)
    try {
      await onSend(draft.trim(), pendingFile)
      setDraft('')
      setPendingFile(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed top-24 right-4 left-4 z-40 flex max-h-[80vh] w-auto max-w-[396px] flex-col overflow-hidden rounded-2xl border border-[var(--corio-neutral-200)] bg-white shadow-[0px_50px_100px_-20px_rgba(50,50,93,0.25),0px_30px_60px_-30px_rgba(0,0,0,0.3)] sm:left-auto sm:right-8 sm:w-[396px]">
      <div className="flex h-[58px] shrink-0 items-center justify-between bg-[#0c111d] px-5 py-4">
        <p className="text-base font-medium text-white">Query &amp; Response Thread</p>
        <button type="button" onClick={onClose} className="text-white/70 hover:text-white">
          <X className="size-6" />
        </button>
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto px-5 py-4">
        {comments.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--corio-neutral-400)]">No message here. Start a conversation.</p>
        )}
        {comments.map(({ comment, author }) => {
          const attachment = attachments.find((a) => a.commentId === comment.id)
          return (
            <div key={comment.id} className="flex gap-2.5 py-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--corio-neutral-100)] text-[10px] font-semibold text-[var(--corio-neutral-600)]">
                {author.name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between text-xs whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-medium text-[var(--corio-neutral-700)]">
                    <span className="truncate">{author.name}</span>
                    <span>&bull;</span>
                    <span>{ROLE_LABELS[author.role] ?? author.role}</span>
                  </div>
                  <span className="text-[var(--corio-neutral-400)]">{formatTime(comment.createdAt)}</span>
                </div>
                <div className="w-full rounded-xl border border-[var(--corio-neutral-100)] px-3 py-2.5 text-xs whitespace-pre-wrap break-words text-[var(--corio-neutral-500)] shadow-[0px_1px_2px_0px_rgba(82,88,102,0.06)]">
                  {comment.body}
                </div>
                {attachment && <AttachmentChip attachment={attachment} />}
              </div>
            </div>
          )
        })}
      </div>

      {canWrite && (
        <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--corio-neutral-100)] p-4">
          {pendingFile && (
            <div className="flex w-fit items-center gap-1.5 rounded-lg border border-[var(--corio-neutral-200)] bg-[var(--corio-neutral-100)] px-2.5 py-1.5 text-xs font-medium text-[var(--corio-neutral-700)]">
              <FileText className="size-3.5 shrink-0 text-destructive" />
              <span className="max-w-[220px] truncate">{pendingFile.name}</span>
              <button type="button" onClick={() => setPendingFile(null)} className="text-[var(--corio-neutral-400)] hover:text-[var(--corio-neutral-700)]">
                <X className="size-3.5" />
              </button>
            </div>
          )}
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write your message… you can enter as much detail as you need."
            className="max-h-[280px] min-h-[120px] resize-y overflow-y-auto"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center rounded-md p-1.5 text-[var(--corio-neutral-400)] hover:bg-[var(--corio-neutral-100)] hover:text-[var(--corio-neutral-700)]"
              title="Attach a file"
            >
              <Paperclip className="size-4.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
            />
            <Button size="sm" disabled={submitting || !draft.trim()} onClick={handleSubmit}>
              {submitting ? 'Sending…' : 'Send Message'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
