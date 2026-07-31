import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'

type CustomerForm = {
  fullName: string
  phoneNumber: string
  email: string
  bvn: string
  nin: string
  employmentType: 'employed' | 'self_employed' | ''
  employerName: string
  businessName: string
  monthlyIncome: string
  guarantorName: string
  guarantorPhone: string
}

const EMPTY_FORM: CustomerForm = {
  fullName: '',
  phoneNumber: '',
  email: '',
  bvn: '',
  nin: '',
  employmentType: '',
  employerName: '',
  businessName: '',
  monthlyIncome: '',
  guarantorName: '',
  guarantorPhone: '',
}

export function NewCustomerModal({
  open,
  onOpenChange,
  onCreate,
  onContinue,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (form: CustomerForm) => Promise<void>
  onContinue: () => void
}) {
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(false)

  function set<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(EMPTY_FORM)
      setCreated(false)
    }
    onOpenChange(next)
  }

  async function handleSubmit() {
    if (!form.fullName.trim() || !form.phoneNumber.trim()) return
    setSubmitting(true)
    try {
      await onCreate(form)
      setCreated(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[460px] gap-6 rounded-2xl p-6 text-center">
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-center rounded-full bg-[var(--corio-green-100)] p-3">
              <CheckCircle2 className="size-6 text-[var(--corio-green-600)]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-xl font-semibold text-[var(--corio-neutral-900)]">Customer Created Successfully</DialogTitle>
              <p className="text-sm text-[var(--corio-neutral-400)]">
                You can now start a new loan application or assign an existing request to this account.
              </p>
            </div>
          </div>
          <Button
            className="h-[42px] w-full rounded-[10px] bg-[#eff4ff] text-[#2970ff] hover:bg-[#eff4ff]/80"
            onClick={() => {
              handleOpenChange(false)
              onContinue()
            }}
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[560px] gap-6 rounded-2xl p-6">
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-xl font-semibold text-[var(--corio-neutral-900)]">New Customer</DialogTitle>
          <p className="text-sm text-[var(--corio-neutral-400)]">Create a customer profile to attach loan applications to.</p>
        </DialogHeader>

        <div className="grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto pr-1">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Enter full name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Phone Number</Label>
            <Input value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} placeholder="0803 000 0000" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email (optional)</Label>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>BVN</Label>
            <Input value={form.bvn} onChange={(e) => set('bvn', e.target.value)} placeholder="11-digit BVN" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>NIN</Label>
            <Input value={form.nin} onChange={(e) => set('nin', e.target.value)} placeholder="11-digit NIN" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Employment Type</Label>
            <NativeSelect value={form.employmentType} onChange={(e) => set('employmentType', e.target.value as CustomerForm['employmentType'])}>
              <option value="">Select type</option>
              <option value="employed">Employed</option>
              <option value="self_employed">Self Employed</option>
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Monthly Income</Label>
            <Input
              type="number"
              value={form.monthlyIncome}
              onChange={(e) => set('monthlyIncome', e.target.value)}
              placeholder="0.00"
            />
          </div>
          {form.employmentType === 'self_employed' ? (
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Business Name</Label>
              <Input value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="Enter business name" />
            </div>
          ) : (
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Employer Name</Label>
              <Input value={form.employerName} onChange={(e) => set('employerName', e.target.value)} placeholder="Enter employer name" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Guarantor Name</Label>
            <Input value={form.guarantorName} onChange={(e) => set('guarantorName', e.target.value)} placeholder="Enter guarantor name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Guarantor Phone</Label>
            <Input value={form.guarantorPhone} onChange={(e) => set('guarantorPhone', e.target.value)} placeholder="0803 000 0000" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.fullName.trim() || !form.phoneNumber.trim()}>
            {submitting ? 'Creating…' : 'Create Customer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
