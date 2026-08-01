import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Download } from 'lucide-react'

import { AppHeader } from '#/components/loans/app-header'
import { BankStatementReport } from '#/components/loans/bank-statement-report'
import { Sidebar } from '#/components/loans/sidebar'
import { Button } from '#/components/ui/button'
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
          <button
            type="button"
            onClick={() => navigate({ to: '/credit-officer/$applicationId', params: { applicationId } })}
            className="flex items-center gap-0.5 text-xs font-medium text-[#155eef]"
          >
            <ChevronRight className="size-3.5 rotate-180" />
            Back
          </button>
          <div className="mt-3 mb-6 flex items-center justify-between">
            <h1 className="text-xl font-medium text-[var(--corio-neutral-900)]">Bank Statement Analysis</h1>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="size-4" />
              Download Report
            </Button>
          </div>
          <BankStatementReport analysis={data.application.bankAnalysisResult} />
        </main>
      </div>
    </div>
  )
}
