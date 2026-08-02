import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Check, X } from 'lucide-react'

import { FileUploadArea } from '#/components/loans/file-upload-area'
import { ProgressTracker, type WizardStep } from '#/components/loans/progress-tracker'
import { Sidebar } from '#/components/loans/sidebar'
import { StatusBadge } from '#/components/loans/status-badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group'
import { Textarea } from '#/components/ui/textarea'
import { ROLE_LOAN_HOME } from '#/lib/auth/role-routes'
import { listCustomersFn } from '#/lib/customers/customers.functions'
import { createApplicationFn, uploadAttachmentFn, uploadBankStatementFn } from '#/lib/loans/loans.functions'

export const Route = createFileRoute('/_authenticated/loan-officer/new')({
  loader: () => listCustomersFn(),
  component: NewLoanApplication,
})

const STEPS: WizardStep[] = ['Applicant Information', 'Loan Details', 'Supporting Document']
const DURATIONS = [1, 3, 6, 12]
const INTEREST_RATE_BPS = 125 // 1.25% flat per month, illustrative

type ApplicantForm = {
  mode: 'existing' | 'new'
  customerId: string
  firstName: string
  lastName: string
  applicantPhone: string
  bvn: string
  nin: string
  employmentType: 'employed' | 'self_employed' | ''
  employerName: string
  businessName: string
  monthlyIncome: string
  guarantorName: string
  guarantorPhone: string
}

type LoanForm = {
  loanType: 'business_loan' | 'personal_loan' | ''
  amountRequested: string
  loanPurpose: string
  loanDurationMonths: number
}

type DocsForm = {
  idType: 'National ID Card' | 'International Passport' | "Driver's License"
  idDocument: File | null
  employmentLetter: File | null
  payslip: File | null
  bankStatement: File | null
  collateralType: 'Car Papers' | 'Land Papers'
  collateralDocument: File | null
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}

function NewLoanApplication() {
  const navigate = useNavigate()
  const { user } = Route.useRouteContext()
  const customers = Route.useLoaderData()
  const createApplication = useServerFn(createApplicationFn)
  const uploadAttachment = useServerFn(uploadAttachmentFn)
  const uploadBankStatement = useServerFn(uploadBankStatementFn)

  const [step, setStep] = useState<WizardStep>('Applicant Information')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ referenceNumber: string; applicantName: string; amountRequested: number } | null>(null)

  const [applicant, setApplicant] = useState<ApplicantForm>({
    mode: 'existing',
    customerId: '',
    firstName: '',
    lastName: '',
    applicantPhone: '',
    bvn: '',
    nin: '',
    employmentType: '',
    employerName: '',
    businessName: '',
    monthlyIncome: '',
    guarantorName: '',
    guarantorPhone: '',
  })

  function selectCustomer(customerId: string) {
    const customer = customers.find((c) => c.id === customerId)
    setApplicant((a) => ({
      ...a,
      customerId,
      guarantorName: customer?.guarantorName ?? a.guarantorName,
      guarantorPhone: customer?.guarantorPhone ?? a.guarantorPhone,
    }))
  }

  const [loan, setLoan] = useState<LoanForm>({
    loanType: '',
    amountRequested: '',
    loanPurpose: '',
    loanDurationMonths: 3,
  })

  const [docs, setDocs] = useState<DocsForm>({
    idType: 'National ID Card',
    idDocument: null,
    employmentLetter: null,
    payslip: null,
    bankStatement: null,
    collateralType: 'Car Papers',
    collateralDocument: null,
  })

  const amount = Number(loan.amountRequested) || 0
  const interest = Math.round(amount * (INTEREST_RATE_BPS / 10000) * loan.loanDurationMonths)
  const totalDue = amount + interest

  const stepIndex = STEPS.indexOf(step)

  function goNext() {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1])
  }
  function goBack() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1])
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.set('mode', applicant.mode)
      if (applicant.mode === 'existing') {
        formData.set('customerId', applicant.customerId)
      } else {
        formData.set('firstName', applicant.firstName)
        formData.set('lastName', applicant.lastName)
        formData.set('applicantPhone', applicant.applicantPhone)
        formData.set('bvn', applicant.bvn)
        formData.set('nin', applicant.nin)
        formData.set('employmentType', applicant.employmentType)
        formData.set('employerName', applicant.employerName)
        formData.set('businessName', applicant.businessName)
        formData.set('monthlyIncome', applicant.monthlyIncome)
      }
      formData.set('guarantorName', applicant.guarantorName)
      formData.set('guarantorPhone', applicant.guarantorPhone)
      formData.set('loanType', loan.loanType)
      formData.set('amountRequested', loan.amountRequested)
      formData.set('loanPurpose', loan.loanPurpose)
      formData.set('loanDurationMonths', String(loan.loanDurationMonths))
      formData.set('interestRateBps', String(INTEREST_RATE_BPS))
      formData.set('totalAmountDue', String(totalDue))

      const application = await createApplication({ data: formData })

      // Uploaded as separate requests (rather than bundled into the request above) so a
      // submission with several scanned documents doesn't exceed serverless body-size limits.
      const attachmentEntries: [File | null, string][] = [
        [docs.idDocument, docs.idType],
        [docs.employmentLetter, 'Employment Letter'],
        [docs.payslip, 'Payslip for the last 10 months'],
        [docs.collateralDocument, docs.collateralType],
      ]
      const uploadResults = await Promise.allSettled([
        ...attachmentEntries
          .filter(([file]) => file)
          .map(([file, documentType]) => {
            const attachmentData = new FormData()
            attachmentData.set('applicationId', application.id)
            attachmentData.set('documentType', documentType)
            attachmentData.set('file', file!)
            return uploadAttachment({ data: attachmentData })
          }),
        ...(docs.bankStatement
          ? [
              (() => {
                const bankStatementData = new FormData()
                bankStatementData.set('applicationId', application.id)
                bankStatementData.set('file', docs.bankStatement)
                return uploadBankStatement({ data: bankStatementData })
              })(),
            ]
          : []),
      ])

      setResult({ referenceNumber: application.referenceNumber, applicantName: application.applicantName, amountRequested: application.amountRequested })

      const failedUploads = uploadResults.filter((r) => r.status === 'rejected')
      if (failedUploads.length > 0) {
        const reasons = failedUploads.map((r) => (r as PromiseRejectedResult).reason)
        console.error('Some attachments failed to upload', reasons)
        setError(
          failedUploads.length === uploadResults.length
            ? 'The application was submitted, but the attached documents failed to upload. Please add them from the application page.'
            : 'The application was submitted, but some attached documents failed to upload. Please add the missing ones from the application page.',
        )
      }
    } catch (err) {
      console.error('Failed to submit application', err)
      setError(err instanceof Error ? err.message : 'Something went wrong submitting the application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Loan" />
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <header className="relative flex h-[72px] shrink-0 items-center justify-center border-b border-[var(--corio-neutral-100)] px-6">
          <button
            type="button"
            onClick={() => navigate({ to: ROLE_LOAN_HOME[user!.role] })}
            className="absolute left-6 flex items-center gap-1.5 text-sm font-medium text-[var(--corio-neutral-500)]"
          >
            <X className="size-5" />
            Close
          </button>
          <h1 className="text-lg font-semibold text-[var(--corio-neutral-900)]">New Loan Application</h1>
        </header>

        <div className="mx-auto w-full max-w-[437px] py-6">
          <ProgressTracker current={step} />
        </div>

        <main className="flex flex-1 justify-center overflow-y-auto px-4 pb-8">
          <div className="w-[780px] max-w-full">
          {step === 'Applicant Information' && (
            <div className="flex flex-col gap-10">
              <Section title="Applicant Information">
                <div className="flex flex-col gap-6">
                  <div className="inline-flex w-fit rounded-lg border border-[var(--corio-neutral-200)] bg-[var(--corio-neutral-100)] p-1">
                    {(['existing', 'new'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setApplicant((a) => ({ ...a, mode }))}
                        className={
                          'rounded-md px-4 py-1.5 text-sm font-medium transition-colors ' +
                          (applicant.mode === mode
                            ? 'bg-white text-[var(--corio-neutral-900)] shadow-sm'
                            : 'text-[var(--corio-neutral-400)]')
                        }
                      >
                        {mode === 'existing' ? 'Use Existing' : 'New customer'}
                      </button>
                    ))}
                  </div>

                  {applicant.mode === 'existing' ? (
                    <Field label="Customer">
                      <NativeSelect value={applicant.customerId} onChange={(e) => selectCustomer(e.target.value)}>
                        <option value="" disabled>Select customer</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} · {c.phoneNumber}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  ) : (
                    <div className="grid grid-cols-2 gap-6">
                      <Field label="First Name">
                        <Input value={applicant.firstName} onChange={(e) => setApplicant({ ...applicant, firstName: e.target.value })} placeholder="Enter first name" />
                      </Field>
                      <Field label="Last Name">
                        <Input value={applicant.lastName} onChange={(e) => setApplicant({ ...applicant, lastName: e.target.value })} placeholder="Enter last name" />
                      </Field>
                      <Field label="Phone Number">
                        <Input value={applicant.applicantPhone} onChange={(e) => setApplicant({ ...applicant, applicantPhone: e.target.value })} placeholder="Enter phone number" />
                      </Field>
                      <Field label="BVN">
                        <Input value={applicant.bvn} onChange={(e) => setApplicant({ ...applicant, bvn: e.target.value })} placeholder="Enter BVN" />
                      </Field>
                      <Field label="NIN">
                        <Input value={applicant.nin} onChange={(e) => setApplicant({ ...applicant, nin: e.target.value })} placeholder="Enter NIN" />
                      </Field>
                      <Field label="Employment Type">
                        <NativeSelect
                          value={applicant.employmentType}
                          onChange={(e) => setApplicant({ ...applicant, employmentType: e.target.value as ApplicantForm['employmentType'] })}
                        >
                          <option value="" disabled>Select employment type</option>
                          <option value="employed">Employed</option>
                          <option value="self_employed">Self Employed</option>
                        </NativeSelect>
                      </Field>
                      {applicant.employmentType === 'self_employed' ? (
                        <Field label="Business Name">
                          <Input value={applicant.businessName} onChange={(e) => setApplicant({ ...applicant, businessName: e.target.value })} placeholder="Enter business name" />
                        </Field>
                      ) : (
                        <Field label="Employer Name">
                          <Input value={applicant.employerName} onChange={(e) => setApplicant({ ...applicant, employerName: e.target.value })} placeholder="Enter employer name" />
                        </Field>
                      )}
                      <Field label="Monthly Income">
                        <Input type="number" value={applicant.monthlyIncome} onChange={(e) => setApplicant({ ...applicant, monthlyIncome: e.target.value })} placeholder="0.00" />
                      </Field>
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Guarantor">
                <div className="grid grid-cols-2 gap-6">
                  <Field label="Guarantor Name">
                    <Input value={applicant.guarantorName} onChange={(e) => setApplicant({ ...applicant, guarantorName: e.target.value })} placeholder="Enter full name" />
                  </Field>
                  <Field label="Guarantor Phone Number">
                    <Input value={applicant.guarantorPhone} onChange={(e) => setApplicant({ ...applicant, guarantorPhone: e.target.value })} placeholder="Enter phone number" />
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {step === 'Loan Details' && (
            <div className="flex flex-col gap-10">
              <Section title="Loan Details">
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-6">
                    <Field label="Loan Type">
                      <NativeSelect
                        value={loan.loanType}
                        onChange={(e) => setLoan({ ...loan, loanType: e.target.value as LoanForm['loanType'] })}
                      >
                        <option value="" disabled>Select loan type</option>
                        <option value="business_loan">Business Loan</option>
                        <option value="personal_loan">Personal Loan</option>
                      </NativeSelect>
                    </Field>
                    <Field label="Loan Amount">
                      <Input type="number" value={loan.amountRequested} onChange={(e) => setLoan({ ...loan, amountRequested: e.target.value })} placeholder="Enter loan amount" />
                    </Field>
                  </div>
                  <Field label="Purpose of Loan">
                    <Textarea value={loan.loanPurpose} onChange={(e) => setLoan({ ...loan, loanPurpose: e.target.value })} placeholder="Describe the purpose of this loan" />
                  </Field>
                </div>
              </Section>

              <div className="flex flex-col gap-5 rounded-2xl bg-[var(--corio-neutral-100)] p-6">
                <h3 className="text-sm font-medium text-[var(--corio-neutral-900)]">Loan Structure</h3>
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-[var(--corio-neutral-900)]">Loan Duration</p>
                  <div className="flex items-center gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setLoan({ ...loan, loanDurationMonths: d })}
                        className={
                          'rounded-full px-2 py-0.5 text-xs font-medium ' +
                          (d === loan.loanDurationMonths ? 'bg-[#20232d] text-white' : 'bg-[var(--corio-neutral-100)] text-[var(--corio-neutral-500)] border border-[var(--corio-neutral-200)]')
                        }
                      >
                        {d} month{d > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <Stat label="Total Amount Borrowed" value={formatNaira(amount)} />
                  <Stat label="Interest" value={`${(INTEREST_RATE_BPS / 100).toFixed(2)}%`} />
                  <Stat label="Total Amount Due" value={formatNaira(totalDue)} />
                </div>
              </div>
            </div>
          )}

          {step === 'Supporting Document' && (
            <div className="flex flex-col gap-10">
              <Section title="Customer KYC Information">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
                    <Field label="Select ID Type">
                      <RadioGroup value={docs.idType} onValueChange={(v) => setDocs({ ...docs, idType: v as DocsForm['idType'] })} className="gap-4">
                        {(['National ID Card', 'International Passport', "Driver's License"] as const).map((option) => (
                          <label key={option} className="flex items-center gap-2 text-sm text-[var(--corio-neutral-900)]">
                            <RadioGroupItem value={option} />
                            {option}
                          </label>
                        ))}
                      </RadioGroup>
                    </Field>
                    <FileUploadArea file={docs.idDocument} onSelect={(f) => setDocs({ ...docs, idDocument: f })} onRemove={() => setDocs({ ...docs, idDocument: null })} />
                  </div>
                  <Field label="Employment Letter">
                    <FileUploadArea file={docs.employmentLetter} onSelect={(f) => setDocs({ ...docs, employmentLetter: f })} onRemove={() => setDocs({ ...docs, employmentLetter: null })} />
                  </Field>
                </div>
              </Section>

              <Section title="Loan Supporting Document">
                <div className="grid grid-cols-2 gap-6">
                  <Field label="Payslip for the last 10 months">
                    <FileUploadArea file={docs.payslip} onSelect={(f) => setDocs({ ...docs, payslip: f })} onRemove={() => setDocs({ ...docs, payslip: null })} />
                  </Field>
                  <Field label="Bank Statement">
                    <FileUploadArea file={docs.bankStatement} onSelect={(f) => setDocs({ ...docs, bankStatement: f })} onRemove={() => setDocs({ ...docs, bankStatement: null })} />
                  </Field>
                </div>
              </Section>

              <Section title="Collaterals">
                <div className="flex flex-col gap-3">
                  <RadioGroup
                    value={docs.collateralType}
                    onValueChange={(v) => setDocs({ ...docs, collateralType: v as DocsForm['collateralType'] })}
                    className="flex flex-row gap-4"
                  >
                    {(['Car Papers', 'Land Papers'] as const).map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-[var(--corio-neutral-900)]">
                        <RadioGroupItem value={option} />
                        {option}
                      </label>
                    ))}
                  </RadioGroup>
                  <FileUploadArea file={docs.collateralDocument} onSelect={(f) => setDocs({ ...docs, collateralDocument: f })} onRemove={() => setDocs({ ...docs, collateralDocument: null })} />
                </div>
              </Section>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
          </div>
        </main>

        <footer className="sticky bottom-0 flex h-[90px] shrink-0 items-center justify-end gap-2 border-t border-[var(--corio-neutral-100)] bg-white px-8">
          {stepIndex > 0 && (
            <Button variant="outline" onClick={goBack} disabled={submitting}>
              Back
            </Button>
          )}
          {stepIndex < STEPS.length - 1 ? (
            <Button onClick={goNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </Button>
          )}
        </footer>
      </div>

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="flex w-[460px] max-w-full flex-col gap-6 rounded-2xl bg-white p-6">
            <div className="flex flex-col items-center gap-5">
              <div className="flex items-center rounded-full bg-[var(--corio-green-100)] p-3 text-[var(--corio-green-600)]">
                <Check className="size-6" strokeWidth={2} />
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <h2 className="text-xl font-semibold text-[var(--corio-neutral-900)]">Application Submitted</h2>
                <p className="text-sm text-[var(--corio-neutral-400)]">Your application has been received and is now pending Branch Manager review.</p>
              </div>
            </div>

            {error && <p className="text-center text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-5 rounded-2xl bg-[var(--corio-neutral-100)] p-6">
              <Row label="Reference Number:" value={result.referenceNumber} />
              <Row label="Applicant" value={result.applicantName} />
              <Row label="Loan Amount" value={formatNaira(result.amountRequested)} />
              <Row label="Submitted" value="Just now" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">Status</span>
                <StatusBadge status="submitted" />
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full border-[var(--corio-blue-500)] text-[var(--corio-blue-500)]"
              onClick={() => navigate({ to: ROLE_LOAN_HOME[user!.role] })}
            >
              Back to dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs font-medium tracking-wider text-[var(--corio-neutral-500)] uppercase">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-[var(--corio-neutral-500)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--corio-neutral-900)]">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">{label}</span>
      <span className="text-sm text-[var(--corio-neutral-600)]">{value}</span>
    </div>
  )
}
