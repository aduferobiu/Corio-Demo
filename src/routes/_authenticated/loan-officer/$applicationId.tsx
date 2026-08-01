import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import { AppHeader } from '#/components/loans/app-header'
import { ApplicationDetailView } from '#/components/loans/application-detail'
import { Sidebar } from '#/components/loans/sidebar'
import { usePoll } from '#/lib/hooks/use-poll'
import { getApplicationFn, postQueryMessageFn, uploadAttachmentFn, uploadBankStatementFn } from '#/lib/loans/loans.functions'
import { queryThreadSearchValidator } from '#/lib/loans/query-search'
import { markQueryNotificationsReadFn } from '#/lib/notifications/notifications.functions'

export const Route = createFileRoute('/_authenticated/loan-officer/$applicationId')({
  validateSearch: queryThreadSearchValidator,
  loader: ({ params }) => getApplicationFn({ data: { id: params.applicationId } }),
  component: LoanOfficerApplicationDetail,
})

function LoanOfficerApplicationDetail() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const { applicationId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const postQueryMessage = useServerFn(postQueryMessageFn)
  const uploadBankStatement = useServerFn(uploadBankStatementFn)
  const uploadAttachment = useServerFn(uploadAttachmentFn)
  const markQueryRead = useServerFn(markQueryNotificationsReadFn)
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
          onBack={() => navigate({ to: '/loan-officer' })}
          canWriteQuery={!isDecided}
          onSendQuery={async (body, file) => {
            const formData = new FormData()
            formData.set('applicationId', applicationId)
            formData.set('body', body)
            if (file) formData.set('file', file)
            await postQueryMessage({ data: formData })
            await router.invalidate()
          }}
          bankStatementReportHref={`/loan-officer/${applicationId}/bank-statement`}
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
          onUploadAttachment={async (documentType, file) => {
            const formData = new FormData()
            formData.set('applicationId', applicationId)
            formData.set('documentType', documentType)
            formData.set('file', file)
            try {
              await uploadAttachment({ data: formData })
              await router.invalidate()
              toast.success('Attachment added')
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed to add attachment')
              throw err
            }
          }}
          auditTrail={data.history}
          openQueryOnMount={search.openQuery === true}
          hasUnreadQuery={data.hasUnreadQuery}
          onOpenQueryThread={async () => {
            if (!data.hasUnreadQuery) return
            await markQueryRead({ data: { applicationId } })
            await router.invalidate()
          }}
        />
      </div>
    </div>
  )
}
