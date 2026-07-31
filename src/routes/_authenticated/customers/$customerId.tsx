import { useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

import { AppHeader } from '#/components/loans/app-header'
import { ContentField } from '#/components/loans/content-field'
import { Sidebar } from '#/components/loans/sidebar'
import { StatusBadge, type LoanStatus } from '#/components/loans/status-badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { getCustomerFn, updateCustomerFn } from '#/lib/customers/customers.functions'
import { formatDate, formatEmploymentType, formatNaira } from '#/lib/loans/format'
import { ROLE_APPLICATION_DETAIL } from '#/lib/auth/role-routes'

export const Route = createFileRoute('/_authenticated/customers/$customerId')({
  loader: ({ params }) => getCustomerFn({ data: { id: params.customerId } }),
  component: CustomerDetail,
})

function CustomerDetail() {
  const { customer, applications } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const router = useRouter()
  const updateCustomer = useServerFn(updateCustomerFn)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nin: customer.nin ?? '',
    employmentType: (customer.employmentType ?? '') as 'employed' | 'self_employed' | '',
    employerName: customer.employerName ?? '',
    businessName: customer.businessName ?? '',
    monthlyIncome: customer.monthlyIncome ? String(customer.monthlyIncome) : '',
  })

  async function handleSave() {
    setSaving(true)
    try {
      await updateCustomer({
        data: {
          id: customer.id,
          nin: form.nin || undefined,
          employmentType: form.employmentType || undefined,
          employerName: form.employerName || undefined,
          businessName: form.businessName || undefined,
          monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : undefined,
        },
      })
      await router.invalidate()
      setEditing(false)
      toast.success('Customer details updated')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Customers" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Customers" />
        <main className="flex flex-1 flex-col gap-6 overflow-y-auto bg-white px-8 py-6">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: '/customers' })}
              className="flex items-center gap-0.5 text-xs font-medium text-[#155eef]"
            >
              <ChevronLeft className="size-3.5" />
              Back
            </button>
            <h1 className="text-xl font-medium text-[var(--corio-neutral-900)]">{customer.fullName}</h1>
          </div>

          <Tabs defaultValue="details">
            <TabsList variant="line" className="h-9 gap-3 border-b border-[var(--corio-neutral-100)] p-0">
              <TabsTrigger value="details" className="px-1">
                Details
              </TabsTrigger>
              <TabsTrigger value="history" className="px-1">
                Application History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex flex-col gap-4 pt-4">
              <div className="grid grid-cols-3 gap-x-5 gap-y-8 rounded-2xl bg-[var(--corio-neutral-100)] p-6">
                <ContentField label="Full Name" value={customer.fullName} />
                <ContentField label="Phone Number" value={customer.phoneNumber} />
                <ContentField label="BVN" value={customer.bvn ?? '—'} />
                <ContentField label="NIN" value={customer.nin ?? '—'} />
                <ContentField label="Employment Type" value={formatEmploymentType(customer.employmentType)} />
                <ContentField label="Employer" value={customer.employmentType === 'self_employed' ? (customer.businessName ?? '—') : (customer.employerName ?? '—')} />
                <ContentField label="Monthly Income" value={customer.monthlyIncome ? formatNaira(customer.monthlyIncome) : '—'} />
                <ContentField label="Guarantor" value={customer.guarantorName ?? '—'} />
                <ContentField label="Guarantor Phone" value={customer.guarantorPhone ?? '—'} />
              </div>

              {!editing ? (
                <Button onClick={() => setEditing(true)} className="w-fit">
                  Update Details
                </Button>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <Label>NIN</Label>
                      <Input value={form.nin} onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Employment Type</Label>
                      <NativeSelect
                        value={form.employmentType}
                        onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as typeof f.employmentType }))}
                      >
                        <option value="">Select type</option>
                        <option value="employed">Employed</option>
                        <option value="self_employed">Self Employed</option>
                      </NativeSelect>
                    </div>
                    {form.employmentType === 'self_employed' ? (
                      <div className="flex flex-col gap-1.5">
                        <Label>Business Name</Label>
                        <Input value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <Label>Employer Name</Label>
                        <Input value={form.employerName} onChange={(e) => setForm((f) => ({ ...f, employerName: e.target.value }))} />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <Label>Monthly Income</Label>
                      <Input
                        type="number"
                        value={form.monthlyIncome}
                        onChange={(e) => setForm((f) => ({ ...f, monthlyIncome: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="pt-4">
              <div className="overflow-hidden rounded-lg border border-[var(--corio-neutral-100)]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
                      <TableHead>Loan</TableHead>
                      <TableHead>Income</TableHead>
                      <TableHead>Exp. Payback Amt</TableHead>
                      <TableHead>Loan duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-[var(--corio-neutral-400)]">
                          No loan applications for this customer yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {applications.map((app) => (
                      <TableRow
                        key={app.id}
                        className="cursor-pointer"
                        onClick={() => navigate({ to: ROLE_APPLICATION_DETAIL[user!.role](app.id) })}
                      >
                        <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatNaira(app.amountRequested)}</TableCell>
                        <TableCell className="text-sm text-[var(--corio-neutral-800)]">
                          {app.monthlyIncome ? formatNaira(app.monthlyIncome) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-[var(--corio-neutral-800)]">
                          {app.totalAmountDue ? formatNaira(app.totalAmountDue) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-[var(--corio-neutral-800)]">
                          {app.loanDurationMonths ? `${app.loanDurationMonths} month${app.loanDurationMonths === 1 ? '' : 's'}` : '—'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={app.status as LoanStatus} />
                        </TableCell>
                        <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatDate(app.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
