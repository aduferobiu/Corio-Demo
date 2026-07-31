import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import { AppHeader } from '#/components/loans/app-header'
import { ApplicationDetailView } from '#/components/loans/application-detail'
import { Sidebar } from '#/components/loans/sidebar'
import { getApplicationFn, postQueryMessageFn } from '#/lib/loans/loans.functions'

export const Route = createFileRoute('/_authenticated/loan-officer/$applicationId')({
  loader: ({ params }) => getApplicationFn({ data: { id: params.applicationId } }),
  component: LoanOfficerApplicationDetail,
})

function LoanOfficerApplicationDetail() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const { applicationId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const postQueryMessage = useServerFn(postQueryMessageFn)
  const isDecided = ['approved', 'rejected', 'declined'].includes(data.application.status)

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
            toast.success('Message sent')
          }}
          bankStatementReportHref={`/loan-officer/${applicationId}/bank-statement`}
        />
      </div>
    </div>
  )
}
