import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Loader2, TriangleAlert } from 'lucide-react'

import { AppHeader } from '#/components/loans/app-header'
import { Sidebar } from '#/components/loans/sidebar'
import { Button } from '#/components/ui/button'
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
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const bankStatementDoc = data.documents.find((d) => d.documentType === 'Bank Statement')

  useEffect(() => {
    let cancelled = false
    setError(null)
    runBankAnalysis({ data: { applicationId } })
      .then(() => {
        if (!cancelled) navigate({ to: '/branch-officer/$applicationId/bank-statement', params: { applicationId }, replace: true })
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to analyse the bank statement')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, attempt])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Loan" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Loan Application" />
        <main className="flex flex-1 items-center justify-center bg-[var(--corio-neutral-100)]/40 px-4">
          <div className="flex w-[420px] max-w-full flex-col items-center gap-4 rounded-2xl border border-[var(--corio-neutral-200)] bg-white p-8 text-center">
            {error ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                  <TriangleAlert className="size-6 text-destructive" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-base font-semibold text-[var(--corio-neutral-900)]">Analysis failed</p>
                  <p className="text-sm text-[var(--corio-neutral-400)]">{error}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: '/branch-officer/$applicationId', params: { applicationId } })}
                  >
                    Back
                  </Button>
                  <Button onClick={() => setAttempt((a) => a + 1)}>Try Again</Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-[var(--corio-blue-500)]/10">
                  <Loader2 className="size-6 animate-spin text-[var(--corio-blue-500)]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-base font-semibold text-[var(--corio-neutral-900)]">Analysing bank statement…</p>
                  <p className="text-sm text-[var(--corio-neutral-400)]">
                    Corio AI is reviewing {bankStatementDoc?.fileName ?? 'the uploaded statement'}
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
