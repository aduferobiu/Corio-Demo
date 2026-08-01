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
import { riskSummary } from '#/lib/loans/bank-analysis'
import { approveByCreditFn, getApplicationFn, postQueryMessageFn, rejectByCreditFn } from '#/lib/loans/loans.functions'
import { queryThreadSearchValidator } from '#/lib/loans/query-search'
import { markQueryNotificationsReadFn } from '#/lib/notifications/notifications.functions'

export const Route = createFileRoute('/_authenticated/credit-officer/$applicationId')({
  validateSearch: queryThreadSearchValidator,
  loader: ({ params }) => getApplicationFn({ data: { id: params.applicationId } }),
  component: CreditOfficerApplicationDetail,
})

function CreditOfficerApplicationDetail() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const { applicationId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()

  const postQueryMessage = useServerFn(postQueryMessageFn)
  const approve = useServerFn(approveByCreditFn)
  const reject = useServerFn(rejectByCreditFn)
  const markQueryRead = useServerFn(markQueryNotificationsReadFn)

  const [approveOpen, setApproveOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)

  const canDecide = data.application.status === 'with_credit'
  const isDecided = ['approved', 'declined'].includes(data.application.status)

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
          onBack={() => navigate({ to: '/credit-officer' })}
          canWriteQuery={!isDecided}
          onSendQuery={async (body, file) => {
            const formData = new FormData()
            formData.set('applicationId', applicationId)
            formData.set('body', body)
            if (file) formData.set('file', file)
            await postQueryMessage({ data: formData })
            await router.invalidate()
          }}
          bankStatementReportHref={`/credit-officer/${applicationId}/bank-statement`}
          auditTrail={data.history}
          openQueryOnMount={search.openQuery === true}
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
        riskSummary={riskSummary(data.application.bankAnalysisResult)}
        onConfirm={async (notes) => {
          try {
            await approve({ data: { applicationId, notes } })
            await router.invalidate()
            toast.success('Application approved')
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
            await reject({ data: { applicationId, notes } })
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
