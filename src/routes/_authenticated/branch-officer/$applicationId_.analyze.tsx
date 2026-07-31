import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Loader2 } from 'lucide-react'

import { AppHeader } from '#/components/loans/app-header'
import { Sidebar } from '#/components/loans/sidebar'
import { getApplicationFn, runBankAnalysisFn } from '#/lib/loans/loans.functions'

export const Route = createFileRoute('/_authenticated/branch-officer/$applicationId_/analyze')({
  loader: ({ params }) => getApplicationFn({ data: { id: params.applicationId } }),
  component: AnalyzeBankStatement,
})

function AnalyzeBankStatement() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const { applicationId } = Route.useParams()
  const navigate = useNavigate()
  const runBankAnalysis = useServerFn(runBankAnalysisFn)

  const bankStatementDoc = data.documents.find((d) => d.documentType === 'Bank Statement')

  useEffect(() => {
    const timer = setTimeout(async () => {
      await runBankAnalysis({ data: { applicationId } })
      navigate({ to: '/branch-officer/$applicationId/bank-statement', params: { applicationId }, replace: true })
    }, 1800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Loan" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Loan Application" />
        <main className="flex flex-1 items-center justify-center bg-[var(--corio-neutral-100)]/40 px-4">
          <div className="flex w-[420px] max-w-full flex-col items-center gap-4 rounded-2xl border border-[var(--corio-neutral-200)] bg-white p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[var(--corio-blue-500)]/10">
              <Loader2 className="size-6 animate-spin text-[var(--corio-blue-500)]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-base font-semibold text-[var(--corio-neutral-900)]">Analysing bank statement…</p>
              <p className="text-sm text-[var(--corio-neutral-400)]">
                Corio AI is reviewing 3 months of transactions in {bankStatementDoc?.fileName ?? 'the uploaded statement'}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
