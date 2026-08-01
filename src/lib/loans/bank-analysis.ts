import { z } from 'zod'

// Structured shape returned by the OpenAI-backed analysis pipeline
// (see bank-analysis-ai.server.ts) and cached on loanApplications.bankAnalysisResult.
export const bankAnalysisSchema = z.object({
  avgMonthlyIncome: z.number(),
  avgMonthlyInflow: z.number(),
  avgMonthlyOutflow: z.number(),
  netMonthlySurplus: z.number(),
  obligations: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      amount: z.number(),
    }),
  ),
  behaviouralFlagsClear: z.boolean(),
  behaviouralFlagsNote: z.string(),
  keyFindings: z.array(z.string()),
  riskLevel: z.enum(['Low', 'Medium', 'High']),
  riskScore: z.number().min(0).max(1),
  riskNote: z.string(),
})

export type BankAnalysisResult = z.infer<typeof bankAnalysisSchema>

export function riskSummary(result: BankAnalysisResult | null | undefined): string {
  if (!result) return 'Bank statement analysis has not been run yet'
  return `${result.riskLevel} Risk · ${result.riskLevel === 'Low' ? 'Recommended for approval' : result.riskNote}`
}
