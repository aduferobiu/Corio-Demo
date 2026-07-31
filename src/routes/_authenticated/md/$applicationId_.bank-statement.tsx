import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

import { AppHeader } from '#/components/loans/app-header'
import { BankStatementReport } from '#/components/loans/bank-statement-report'
import { Sidebar } from '#/components/loans/sidebar'
import { getApplicationFn } from '#/lib/loans/loans.functions'

export const Route = createFileRoute('/_authenticated/md/$applicationId_/bank-statement')({
  loader: ({ params }) => getApplicationFn({ data: { id: params.applicationId } }),
  component: MdBankStatement,
})

function MdBankStatement() {
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
            onClick={() => navigate({ to: '/md/$applicationId', params: { applicationId } })}
            className="flex items-center gap-0.5 text-xs font-medium text-[#155eef]"
          >
            <ChevronRight className="size-3.5 rotate-180" />
            Back
          </button>
          <h1 className="mt-3 mb-6 text-xl font-medium text-[var(--corio-neutral-900)]">Bank Statement Report</h1>
          <BankStatementReport application={data.application} />
        </main>
      </div>
    </div>
  )
}
