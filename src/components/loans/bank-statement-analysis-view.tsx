import { ChevronRight, Download } from 'lucide-react'

import { BankStatementReport } from '#/components/loans/bank-statement-report'
import { Button } from '#/components/ui/button'
import type { BankAnalysisResult } from '#/lib/loans/bank-analysis'

const RECOMMENDATION: Record<'Low' | 'Medium' | 'High', string> = {
  Low: 'This application is recommended for approval based on income stability, repayment capacity and clean account conduct.',
  Medium: 'This application requires further review — moderate risk indicators were found in the account activity.',
  High: 'This application is not recommended for approval based on elevated risk indicators in the account activity.',
}

// Shared by every role's bank-statement route so the recommendation banner (and the
// rest of the report) reads the same regardless of who's reviewing it.
export function BankStatementAnalysisView({
  analysis,
  onBack,
}: {
  analysis: BankAnalysisResult | null | undefined
  onBack: () => void
}) {
  return (
    <>
      <button type="button" onClick={onBack} className="flex items-center gap-0.5 text-xs font-medium text-[#155eef]">
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
    </>
  )
}
