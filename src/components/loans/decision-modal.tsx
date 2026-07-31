import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Textarea } from '#/components/ui/textarea'
import { formatNaira } from '#/lib/loans/format'

type DecisionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant: 'approve' | 'reject'
  actorName: string
  applicantName: string
  referenceNumber: string
  amountRequested: number
  riskSummary?: string
  onConfirm: (notes: string) => Promise<void>
}

export function DecisionModal({
  open,
  onOpenChange,
  variant,
  actorName,
  applicantName,
  referenceNumber,
  amountRequested,
  riskSummary,
  onConfirm,
}: DecisionModalProps) {
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isApprove = variant === 'approve'
  const notesRequired = !isApprove

  async function handleConfirm() {
    if (notesRequired && !notes.trim()) return
    setSubmitting(true)
    try {
      await onConfirm(notes.trim())
      setNotes('')
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[546px] gap-6 rounded-2xl p-6">
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-xl font-semibold text-[var(--corio-neutral-900)]">
            {isApprove ? 'Confirm Approval' : 'Confirm Decline'}
          </DialogTitle>
          <p className="text-sm text-[var(--corio-neutral-400)]">
            You are {isApprove ? 'approving' : 'declining'} this application as {actorName}, Credit Officer.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isApprove && (
            <div className="flex flex-col gap-4 rounded-2xl bg-[var(--corio-neutral-100)] p-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">Reference Number:</span>
                <span className="text-sm text-[var(--corio-neutral-600)]">{referenceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">Applicant</span>
                <span className="text-sm text-[var(--corio-neutral-600)]">{applicantName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">Loan Amount</span>
                <span className="text-sm text-[var(--corio-neutral-600)]">{formatNaira(amountRequested)}</span>
              </div>
              {riskSummary && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">Risk Assessment</span>
                  <span className="text-sm text-[var(--corio-neutral-600)]">{riskSummary}</span>
                </div>
              )}
            </div>
          )}

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isApprove ? 'Add any notes for the record (optional)' : 'Explain why this application is being declined'}
          />

          <div className="flex items-start gap-2 rounded-xl bg-[var(--corio-yellow-light)]/40 p-3 text-xs text-[var(--corio-neutral-600)]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--corio-yellow-darker)]" />
            <span>This decision is final and cannot be undone once submitted.</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || (notesRequired && !notes.trim())}
            className={!isApprove ? 'bg-destructive hover:bg-destructive/90' : undefined}
          >
            {submitting ? 'Submitting…' : isApprove ? 'Confirm Approval' : 'Confirm Decline'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
