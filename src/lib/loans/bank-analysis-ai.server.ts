import { DOMMatrix, DOMPoint, DOMRect, ImageData, Path2D } from '@napi-rs/canvas'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { PDFParse } from 'pdf-parse'

import { bankAnalysisSchema, type BankAnalysisResult } from '#/lib/loans/bank-analysis'

// pdfjs-dist (used internally by pdf-parse) assumes it's running in a browser and calls
// `new DOMMatrix(...)` / `new Path2D(...)` etc. as bare globals for glyph-path and image
// transforms. Installing @napi-rs/canvas alone doesn't provide these — it only exports the
// classes, it doesn't register them on globalThis — so any statement whose content stream
// exercises those code paths (most real-world PDFs, unlike simple text-only ones) throws
// "DOMMatrix is not defined". Registering them here, once, before any PDF is parsed, fixes it.
const webPlatformPolyfills = { DOMMatrix, DOMPoint, DOMRect, ImageData, Path2D }
for (const [name, ctor] of Object.entries(webPlatformPolyfills)) {
  if (!(name in globalThis)) {
    ;(globalThis as Record<string, unknown>)[name] = ctor
  }
}

// pdf-parse's PDFParse also needs pdfjs-dist's worker message handler. Normally it loads that via
// a dynamic import of a runtime-computed path (GlobalWorkerOptions.workerSrc, resolved relative to
// pdfjs-dist's own bundled location), but our server bundler rewrites file layout for deployment
// and that computed path stops resolving there — surfacing as `Setting up fake worker failed:
// Cannot find module '.../pdf.worker.mjs'` in production, even though it works locally. Importing
// the worker module directly here, through a path our own bundler can trace statically, and
// registering it on globalThis.pdfjsWorker lets pdfjs-dist find it without that broken import.
// @ts-expect-error — pdfjs-dist ships no type declarations for its worker build
const { WorkerMessageHandler } = await import('pdfjs-dist/legacy/build/pdf.worker.mjs')
if (!('pdfjsWorker' in globalThis)) {
  ;(globalThis as Record<string, unknown>).pdfjsWorker = { WorkerMessageHandler }
}

const SYSTEM_PROMPT = `You are a credit risk analyst at a Nigerian microfinance bank, reviewing a customer's bank statement (extracted as plain text from a PDF) as part of a loan application review.

Analyse the transaction history and produce a structured assessment:
- avgMonthlyIncome / avgMonthlyInflow / avgMonthlyOutflow / netMonthlySurplus: monthly figures in Naira (NGN), averaged across the months covered by the statement.
- obligations: recurring commitments visible in the transactions (loan repayments, subscriptions, utilities, rent, etc.), each with a short title, a one-line detail describing the pattern, and the average monthly amount in Naira.
- behaviouralFlagsClear / behaviouralFlagsNote: whether the account conduct is clean. Look for gambling activity, returned/bounced payments, irregular cash cycling, salary interruptions, and unexplained large withdrawals. Set behaviouralFlagsClear to false if any are found, and describe what was found in behaviouralFlagsNote; otherwise note that conduct is clean.
- keyFindings: 3-5 short bullet-point findings a credit officer would want to see, covering income stability, surplus, existing obligations, and account conduct.
- riskLevel: "Low", "Medium", or "High" based on income stability, surplus relative to income, and account conduct.
- riskScore: a number from 0 (lowest risk) to 1 (highest risk), consistent with riskLevel.
- riskNote: a short label for the recommended monitoring level, e.g. "Standard Monitoring", "Periodic Review", or "Enhanced Monitoring".

Base every figure strictly on what appears in the statement text. If the statement is too short or unclear to derive a real figure, make a reasonable conservative estimate rather than inventing precise numbers.`

let client: OpenAI | null = null

function getClient() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
    client = new OpenAI({ apiKey })
  }
  return client
}

export async function extractStatementText(dataUrl: string): Promise<string> {
  const base64 = dataUrl.split(',')[1]
  if (!base64) throw new Error('Bank statement file has no readable content')
  const buffer = Buffer.from(base64, 'base64')

  const parser = new PDFParse({ data: buffer })
  try {
    const { text } = await parser.getText()
    if (!text.trim()) throw new Error('Could not extract any text from the bank statement PDF')
    return text
  } finally {
    await parser.destroy()
  }
}

export async function analyzeStatementText(statementText: string): Promise<BankAnalysisResult> {
  const completion = await getClient().chat.completions.parse({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      // Cap input length as a cost/safety guard against unexpectedly large statements.
      { role: 'user', content: statementText.slice(0, 60_000) },
    ],
    response_format: zodResponseFormat(bankAnalysisSchema, 'bank_statement_analysis'),
  })

  const parsed = completion.choices[0]?.message.parsed
  if (!parsed) throw new Error('OpenAI did not return a structured analysis')
  return parsed
}
