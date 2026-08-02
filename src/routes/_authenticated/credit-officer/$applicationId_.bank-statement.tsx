import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { AppHeader } from '#/components/loans/app-header'
import { BankStatementAnalysisView } from '#/components/loans/bank-statement-analysis-view'
import { Sidebar } from '#/components/loans/sidebar'
import { getApplicationFn } from '#/lib/loans/loans.functions'

export const Route = createFileRoute('/_authenticated/credit-officer/$applicationId_/bank-statement')({
  loader: ({ params }) => getApplicationFn({ data: { id: params.applicationId } }),
  component: CreditOfficerBankStatement,
})

function CreditOfficerBankStatement() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const { applicationId } = Route.useParams()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Loan" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Loan Application" />
        <main className="flex-1 overflow-y-auto bg-white px-8 py-6">
          <BankStatementAnalysisView
            analysis={data.application.bankAnalysisResult}
            onBack={() => navigate({ to: '/credit-officer/$applicationId', params: { applicationId } })}
          />
        </main>
      </div>
    </div>
  )
}
