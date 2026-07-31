import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight, FileText, History, Plus, Trash2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { AuditTrailPanel } from '#/components/loans/audit-trail-panel'
import { BankStatementUploadModal } from '#/components/loans/bank-statement-upload-modal'
import { ContentField } from '#/components/loans/content-field'
import { QueryThreadPanel } from '#/components/loans/query-thread'
import { InitialsAvatar } from '#/components/initials-avatar'
import { StatusBadge, type LoanStatus } from '#/components/loans/status-badge'
import { formatEmploymentType, formatLoanType, formatNaira, formatQueueDuration } from '#/lib/loans/format'

type AuditEntry = {
  id: string
  fromStatus: string | null
  toStatus: string
  note: string | null
  createdAt: Date
  actorName: string
  actorRole: string
}

type ApplicationRow = {
  id: string
  referenceNumber: string
  applicantName: string
  applicantPhone: string
  bvn: string | null
  employmentType: string | null
  employerName: string | null
  businessName: string | null
  monthlyIncome: number | null
  guarantorName: string | null
  guarantorPhone: string | null
  loanType: string | null
  amountRequested: number
  loanPurpose: string | null
  loanDurationMonths: number | null
  totalAmountDue: number | null
  status: string
  updatedAt: Date
}

type DocumentRow = {
  id: string
  commentId: string | null
  fileName: string
  mimeType: string
  dataUrl: string | null
  documentType: string
}

type ThreadComment = {
  comment: { id: string; type: string; body: string; createdAt: Date }
  author: { name: string; role: string }
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl bg-[var(--corio-neutral-100)] p-6">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-[var(--corio-neutral-600)]">{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

export function ApplicationDetailView({
  application,
  comments,
  documents,
  onBack,
  headerActions,
  canWriteQuery,
  onSendQuery,
  bankStatementReportHref,
  bankAnalysisRunAt,
  onRunBankAnalysis,
  onUploadBankStatement,
  onDeleteBankStatement,
  auditTrail,
  hasUnreadQuery,
  onOpenQueryThread,
}: {
  application: ApplicationRow
  comments: ThreadComment[]
  documents: DocumentRow[]
  onBack: () => void
  headerActions?: React.ReactNode
  canWriteQuery?: boolean
  onSendQuery?: (body: string, file: File | null) => Promise<void>
  bankStatementReportHref?: string
  bankAnalysisRunAt?: Date | null
  onRunBankAnalysis?: () => void
  onUploadBankStatement?: (file: File) => Promise<void>
  onDeleteBankStatement?: (documentId: string) => Promise<void>
  auditTrail?: AuditEntry[]
  hasUnreadQuery?: boolean
  onOpenQueryThread?: () => void
}) {
  const [queryOpen, setQueryOpen] = useState(false)
  const [uploadStatementOpen, setUploadStatementOpen] = useState(false)
  const [auditTrailOpen, setAuditTrailOpen] = useState(false)

  const bankStatementDocs = documents.filter((d) => d.documentType === 'Bank Statement')
  // Once the branch officer has made a decision (or analysis has run), the bank
  // statement record is final. "queried" is excluded on purpose — a branch officer
  // may still need to attach an updated statement while a query is outstanding.
  const statementsLocked =
    Boolean(bankAnalysisRunAt) || ['with_credit', 'approved', 'rejected', 'declined'].includes(application.status)
  const otherDocs = documents.filter((d) => d.documentType !== 'Bank Statement' && d.documentType !== 'Query Attachment')
  const threadAttachments = documents.filter((d) => d.commentId)
  const employerOrBusiness = application.employmentType === 'self_employed' ? application.businessName : application.employerName
  const repaymentPerMonth =
    application.totalAmountDue && application.loanDurationMonths
      ? Math.round(application.totalAmountDue / application.loanDurationMonths)
      : null

  return (
    <main className="relative flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-8">
      <button type="button" onClick={onBack} className="flex items-center gap-0.5 text-xs font-medium text-[#155eef]">
        <ChevronRight className="size-3.5 rotate-180" />
        Back
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-medium text-[var(--corio-neutral-900)]">Application {application.referenceNumber}</h1>
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--corio-neutral-100)] bg-white px-3 py-1.5 shadow-[0px_1px_2px_0px_rgba(82,88,102,0.06)]">
            <span className="text-xs text-[var(--corio-neutral-600)]">Status</span>
            <span className="text-sm text-[var(--corio-neutral-600)]">&bull;</span>
            <StatusBadge status={application.status as LoanStatus} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {auditTrail && (
            <button
              type="button"
              title="Audit trail"
              onClick={() => setAuditTrailOpen((v) => !v)}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--corio-neutral-200)] text-[var(--corio-neutral-500)] hover:bg-[var(--corio-neutral-100)]"
            >
              <History className="size-4.5" />
            </button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="relative h-9"
            onClick={() => {
              setQueryOpen((v) => {
                const next = !v
                if (next) onOpenQueryThread?.()
                return next
              })
            }}
          >
            View Query
            {hasUnreadQuery && (
              <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-destructive ring-2 ring-white" />
            )}
          </Button>
          {headerActions}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-4 rounded-xl border border-[var(--corio-neutral-200)] bg-white p-4">
        <InitialsAvatar name={application.applicantName} className="size-10 text-sm font-semibold" />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--corio-neutral-800)]">{application.applicantName}</span>
            <span className="inline-flex items-center rounded-full bg-[#c2efff] px-2 py-0.5 text-xs font-medium text-[#164564]">
              In queue: {formatQueueDuration(application.updatedAt)}
            </span>
          </div>
          <p className="text-xs text-[var(--corio-neutral-400)]">
            {formatNaira(application.amountRequested)} · {application.loanPurpose || 'No stated purpose'} ·{' '}
            {formatEmploymentType(application.employmentType)}
            {employerOrBusiness ? `, ${employerOrBusiness}` : ''} · Monthly income {formatNaira(application.monthlyIncome ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-[17px] mx-auto flex w-full max-w-[1600px] flex-col items-start gap-6 xl:flex-row">
        <div className="flex w-full min-w-0 flex-col gap-6 xl:flex-1">
          <Card title="Personal Information">
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 2xl:grid-cols-3">
              <ContentField label="Full Name" value={application.applicantName} />
              <ContentField label="Phone Number" value={application.applicantPhone} />
              <ContentField label="BVN" value={application.bvn ?? '—'} />
              <ContentField label="Employment Type" value={formatEmploymentType(application.employmentType)} />
              <ContentField
                label={application.employmentType === 'self_employed' ? 'Business' : 'Employer'}
                value={employerOrBusiness ?? '—'}
              />
              <ContentField label="Monthly Income" value={formatNaira(application.monthlyIncome ?? 0)} />
              <ContentField label="Guarantor" value={application.guarantorName ?? '—'} />
              <ContentField label="Guarantor Phone" value={application.guarantorPhone ?? '—'} />
            </div>
          </Card>

          <Card title="Loan Details">
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 2xl:grid-cols-3">
              <ContentField label="Loan Amount Requested" value={formatNaira(application.amountRequested)} />
              <ContentField label="Loan Type" value={formatLoanType(application.loanType)} />
              <ContentField label="Loan Purpose" value={application.loanPurpose ?? '—'} />
              <ContentField label="Loan Duration" value={application.loanDurationMonths ? `${application.loanDurationMonths} Months` : '—'} />
              <ContentField label="Amount to Be Repaid" value={formatNaira(application.totalAmountDue ?? application.amountRequested)} />
              <ContentField label="Repayment Plan" value={repaymentPerMonth ? `${formatNaira(repaymentPerMonth)} per month` : '—'} />
            </div>
          </Card>
        </div>

        <div className="flex w-full flex-col gap-6 xl:w-[426px] xl:shrink-0">
          <Card title="Attachments">
            {otherDocs.length === 0 && <p className="text-sm text-[var(--corio-neutral-400)]">No supporting documents uploaded.</p>}
            {otherDocs.map((doc) => (
              <div key={doc.id} className="flex flex-col gap-2 w-full">
                <p className="text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">{doc.documentType}</p>
                <div className="flex items-center gap-2 self-start rounded-lg border border-[var(--corio-neutral-200)] bg-white py-2 pr-4 pl-2 shadow-[0px_2px_4px_0px_rgba(27,28,29,0.04)]">
                  <FileText className="size-4 text-[var(--corio-blue-500)]" />
                  <span className="text-xs font-medium text-[var(--corio-neutral-900)]">{doc.fileName}</span>
                </div>
              </div>
            ))}
          </Card>

          <Card
            title="Bank Statement"
            action={
              onUploadBankStatement && !statementsLocked ? (
                <button
                  type="button"
                  onClick={() => setUploadStatementOpen(true)}
                  className="flex items-center gap-1 text-sm font-medium text-[var(--corio-blue-500)]"
                >
                  <Plus className="size-5" />
                  {bankStatementDocs.length > 0 ? 'Add Document' : 'New Bank Statement'}
                </button>
              ) : undefined
            }
          >
            {bankStatementDocs.length > 0 ? (
              <>
                {bankStatementDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex w-full items-center gap-3 rounded-xl border border-[var(--corio-neutral-200)] bg-white py-3 pr-5 pl-3 shadow-[0px_2px_4px_0px_rgba(27,28,29,0.04)]"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--corio-neutral-100)] text-[var(--corio-blue-500)]">
                      <FileText className="size-5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-[var(--corio-neutral-900)]">{doc.fileName}</p>
                      <p className="text-xs text-[var(--corio-neutral-500)]">Uploaded with application</p>
                    </div>
                    {onDeleteBankStatement && !statementsLocked && (
                      <button type="button" onClick={() => onDeleteBankStatement(doc.id)} className="shrink-0 text-[var(--corio-neutral-400)] hover:text-destructive">
                        <Trash2 className="size-5" />
                      </button>
                    )}
                  </div>
                ))}
                {onRunBankAnalysis && !statementsLocked ? (
                  <Button className="w-full" onClick={onRunBankAnalysis}>
                    Analyse Statement
                  </Button>
                ) : (
                  bankStatementReportHref && (
                    <Button asChild className="w-full">
                      <Link href={bankStatementReportHref}>View Report</Link>
                    </Button>
                  )
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--corio-neutral-400)]">No bank statement uploaded.</p>
            )}
          </Card>
        </div>
      </div>

      <QueryThreadPanel
        open={queryOpen}
        onClose={() => setQueryOpen(false)}
        comments={comments}
        attachments={threadAttachments}
        canWrite={canWriteQuery}
        onSend={onSendQuery}
      />

      {onUploadBankStatement && (
        <BankStatementUploadModal open={uploadStatementOpen} onOpenChange={setUploadStatementOpen} onUpload={onUploadBankStatement} />
      )}

      {auditTrail && <AuditTrailPanel open={auditTrailOpen} onClose={() => setAuditTrailOpen(false)} entries={auditTrail} />}
    </main>
  )
}
