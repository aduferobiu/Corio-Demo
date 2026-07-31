import { useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import { AppHeader } from '#/components/loans/app-header'
import { ApplicationDetailView } from '#/components/loans/application-detail'
import { DecisionModal } from '#/components/loans/decision-modal'
import { Sidebar } from '#/components/loans/sidebar'
import { Button } from '#/components/ui/button'
import { usePoll } from '#/lib/hooks/use-poll'
import {
  approveByBranchFn,
  declineByBranchFn,
  deleteBankStatementFn,
  getApplicationFn,
  postQueryMessageFn,
  uploadBankStatementFn,
} from '#/lib/loans/loans.functions'
import { markQueryNotificationsReadFn } from '#/lib/notifications/notifications.functions'

export const Route = createFileRoute('/_authenticated/branch-officer/$applicationId')({
  loader: ({ params }) => getApplicationFn({ data: { id: params.applicationId } }),
  component: BranchOfficerApplicationDetail,
})

function BranchOfficerApplicationDetail() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const { applicationId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()

  const postQueryMessage = useServerFn(postQueryMessageFn)
  const approve = useServerFn(approveByBranchFn)
  const decline = useServerFn(declineByBranchFn)
  const uploadBankStatement = useServerFn(uploadBankStatementFn)
  const deleteBankStatement = useServerFn(deleteBankStatementFn)
  const markQueryRead = useServerFn(markQueryNotificationsReadFn)

  const [approveOpen, setApproveOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)

  const canDecide = data.application.status === 'submitted'
  const isDecided = ['approved', 'rejected', 'declined'].includes(data.application.status)

  usePoll(() => router.invalidate(), 5000)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Loan" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Loan Application" />
        <ApplicationDetailView
          application={data.application}
          comments={data.comments}
          documents={data.documents}
          onBack={() => navigate({ to: '/branch-officer' })}
          canWriteQuery={!isDecided}
          onSendQuery={async (body, file) => {
            const formData = new FormData()
            formData.set('applicationId', applicationId)
            formData.set('body', body)
            if (file) formData.set('file', file)
            await postQueryMessage({ data: formData })
            await router.invalidate()
          }}
          bankStatementReportHref={`/branch-officer/${applicationId}/bank-statement`}
          bankAnalysisRunAt={data.application.bankAnalysisRunAt}
          onRunBankAnalysis={() => navigate({ to: '/branch-officer/$applicationId/analyze', params: { applicationId } })}
          onUploadBankStatement={async (file) => {
            const formData = new FormData()
            formData.set('applicationId', applicationId)
            formData.set('file', file)
            try {
              await uploadBankStatement({ data: formData })
              await router.invalidate()
              toast.success('Bank statement uploaded')
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed to upload bank statement')
              throw err
            }
          }}
          onDeleteBankStatement={async (documentId) => {
            try {
              await deleteBankStatement({ data: { documentId } })
              await router.invalidate()
              toast.success('Bank statement removed')
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed to remove bank statement')
            }
          }}
          hasUnreadQuery={data.hasUnreadQuery}
          onOpenQueryThread={async () => {
            if (!data.hasUnreadQuery) return
            await markQueryRead({ data: { applicationId } })
            await router.invalidate()
          }}
          headerActions={
            canDecide ? (
              <>
                <Button variant="outline" className="h-9 border-destructive text-destructive" onClick={() => setDeclineOpen(true)}>
                  Decline
                </Button>
                <Button variant="outline" className="h-9 border-[var(--corio-blue-500)] text-[var(--corio-blue-500)]" onClick={() => setApproveOpen(true)}>
                  Approve
                </Button>
              </>
            ) : undefined
          }
        />
      </div>

      <DecisionModal
        open={approveOpen}
        onOpenChange={setApproveOpen}
        variant="approve"
        actorName={user!.name}
        actorRole={user!.role}
        applicantName={data.application.applicantName}
        referenceNumber={data.application.referenceNumber}
        amountRequested={data.application.amountRequested}
        onConfirm={async (notes) => {
          try {
            await approve({ data: { applicationId, notes } })
            await router.invalidate()
            toast.success('Application approved and sent to credit review')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to approve application')
            throw err
          }
        }}
      />
      <DecisionModal
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        variant="reject"
        actorName={user!.name}
        actorRole={user!.role}
        applicantName={data.application.applicantName}
        referenceNumber={data.application.referenceNumber}
        amountRequested={data.application.amountRequested}
        onConfirm={async (notes) => {
          try {
            await decline({ data: { applicationId, notes } })
            await router.invalidate()
            toast.success('Application declined')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to decline application')
            throw err
          }
        }}
      />
    </div>
  )
}
