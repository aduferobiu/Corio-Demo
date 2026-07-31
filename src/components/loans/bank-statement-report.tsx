import { CheckCircle2, ShieldCheck } from 'lucide-react'

import { analyzeBankStatement } from '#/lib/loans/bank-analysis'
import { formatNaira } from '#/lib/loans/format'

const RISK_COLORS: Record<string, string> = {
  Low: '#17b26a',
  Medium: '#f79009',
  High: '#f04438',
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-[var(--corio-neutral-200)] bg-white p-6">
      <p className="text-sm text-[var(--corio-neutral-500)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--corio-neutral-900)]">{value}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-5 rounded-2xl border border-[var(--corio-neutral-200)] bg-white p-6">
      <p className="text-base font-semibold text-[var(--corio-neutral-900)]">{title}</p>
      {children}
    </div>
  )
}

type ApplicationForAnalysis = Parameters<typeof analyzeBankStatement>[0]

export function BankStatementReport({ application }: { application: ApplicationForAnalysis }) {
  const analysis = analyzeBankStatement(application)
  const barCount = 40
  const litBars = Math.round(analysis.riskScore * barCount)
  const riskColor = RISK_COLORS[analysis.riskLevel]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-stretch gap-6">
        <Stat label="Avg. Monthly Income" value={formatNaira(analysis.avgMonthlyIncome)} />
        <Stat label="Avg. Monthly Inflow" value={formatNaira(analysis.avgMonthlyInflow)} />
        <Stat label="Avg. Monthly Outflow" value={formatNaira(analysis.avgMonthlyOutflow)} />
        <Stat label="Net Monthly Surplus" value={formatNaira(analysis.netMonthlySurplus)} />
      </div>

      <div className="flex items-stretch gap-6">
        <Card title="Recurring Financial Obligations">
          <div className="flex flex-col gap-4 divide-y divide-[var(--corio-neutral-100)]">
            {analysis.obligations.map((o, i) => (
              <div key={o.title} className={`flex items-center justify-between ${i > 0 ? 'pt-4' : ''}`}>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-[var(--corio-neutral-900)]">{o.title}</p>
                  <p className="text-sm text-[var(--corio-neutral-500)]">{o.detail}</p>
                </div>
                <p className="shrink-0 text-sm font-medium text-[var(--corio-neutral-900)]">{formatNaira(o.amount)} / month</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Behavioural Flags">
          <div className="flex items-start gap-2 rounded-xl bg-[var(--corio-green-100)] p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--corio-green-600)]" />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-[var(--corio-green-600)]">
                {analysis.behaviouralFlagsClear ? 'No adverse flags detected' : 'Review recommended'}
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--corio-neutral-500)]">
            Checked for: gambling activity, returned payments, irregular cash cycling, salary interruptions and unexplained large
            withdrawals.
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        <p className="text-lg font-semibold text-[var(--corio-neutral-900)]">Risk Assessment</p>
        <div className="flex items-stretch gap-6">
          <Card title="Key Findings">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {analysis.keyFindings.map((finding) => (
                <div key={finding} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--corio-green-600)]" />
                  <p className="text-sm text-[var(--corio-neutral-600)]">{finding}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Overall Risk Level">
            <div className="flex h-[55px] items-stretch gap-[3.5px]">
              {Array.from({ length: barCount }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full"
                  style={{ backgroundColor: i < litBars ? riskColor : 'var(--corio-neutral-200)' }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-[var(--corio-neutral-100)] p-4">
              <p className="text-xl font-semibold" style={{ color: riskColor }}>
                {analysis.riskLevel}
              </p>
              <p className="text-sm text-[var(--corio-neutral-500)]">{analysis.riskNote}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
