import type { loanApplications } from '#/db/schema'

type LoanApplication = typeof loanApplications.$inferSelect

/**
 * Illustrative bank-statement analysis derived from the application's own declared figures.
 * There is no real bank-statement parsing in this demo — this stands in for what a document
 * analysis pipeline would eventually produce.
 */
export function analyzeBankStatement(application: LoanApplication) {
  const income = application.monthlyIncome ?? 250_000
  const inflow = Math.round(income * 1.02)
  const outflow = Math.round(income * 0.72)
  const surplus = inflow - outflow

  const existingRepayment = Math.round(income * 0.12)
  const utilities = Math.round(income * 0.06)

  const surplusRatio = surplus / income
  const riskLevel: 'Low' | 'Medium' | 'High' = surplusRatio > 0.2 ? 'Low' : surplusRatio > 0.05 ? 'Medium' : 'High'
  const riskScore = riskLevel === 'Low' ? 0.18 : riskLevel === 'Medium' ? 0.5 : 0.82

  return {
    avgMonthlyIncome: income,
    avgMonthlyInflow: inflow,
    avgMonthlyOutflow: outflow,
    netMonthlySurplus: surplus,
    obligations: [
      {
        title: 'Existing loan repayment',
        detail: 'Standing order · debited monthly',
        amount: existingRepayment,
      },
      {
        title: 'Utilities & subscriptions',
        detail: 'Electricity, internet and mobile · consistent across all months reviewed',
        amount: utilities,
      },
    ],
    behaviouralFlagsClear: riskLevel !== 'High',
    keyFindings: [
      `Stable, verifiable ${application.employmentType === 'self_employed' ? 'business' : 'salary'} income over the review period`,
      `Net monthly surplus of ${formatNairaShort(surplus)} after all recurring commitments`,
      `Existing obligation of ${formatNairaShort(existingRepayment)} per month, serviced without missed payments`,
      'No adverse behavioural patterns detected in account conduct',
      `Requested repayment sits ${riskLevel === 'High' ? 'above' : 'within'} the acceptable range for the stated income`,
    ],
    riskLevel,
    riskScore,
    riskNote: riskLevel === 'Low' ? 'Standard Monitoring' : riskLevel === 'Medium' ? 'Periodic Review' : 'Enhanced Monitoring',
  }
}

function formatNairaShort(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}
