import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Download } from 'lucide-react'

import { AppHeader } from '#/components/loans/app-header'
import { BankStatementReport } from '#/components/loans/bank-statement-report'
import { Sidebar } from '#/components/loans/sidebar'
import { Button } from '#/components/ui/button'
import { getApplicationFn } from '#/lib/loans/loans.functions'

export const Route = createFileRoute('/_authenticated/branch-officer/$applicationId_/bank-statement')({
  loader: ({ params }) => getApplicationFn({ data: { id: params.applicationId } }),
  component: BranchOfficerBankStatement,
})

const RECOMMENDATION: Record<'Low' | 'Medium' | 'High', string> = {
  Low: 'This application is recommended for approval based on income stability, repayment capacity and clean account conduct.',
  Medium: 'This application requires further review — moderate risk indicators were found in the account activity.',
  High: 'This application is not recommended for approval based on elevated risk indicators in the account activity.',
}

function BranchOfficerBankStatement() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const { applicationId } = Route.useParams()
  const navigate = useNavigate()
  const analysis = data.application.bankAnalysisResult

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Loan" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Loan Application" />
        <main className="flex-1 overflow-y-auto bg-white px-8 py-6">
          <button
            type="button"
            onClick={() => navigate({ to: '/branch-officer/$applicationId', params: { applicationId } })}
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

          {analysis && (
            <div className="mb-6 flex items-start gap-2 rounded-2xl bg-[var(--corio-green-100)] p-4">
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--corio-green-600)] text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="size-3">
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-[var(--corio-green-600)]">Recommendation</p>
                <p className="text-sm text-[var(--corio-neutral-600)]">{RECOMMENDATION[analysis.riskLevel]}</p>
              </div>
            </div>
          )}

          <BankStatementReport analysis={analysis} />
        </main>
      </div>
    </div>
  )
}
