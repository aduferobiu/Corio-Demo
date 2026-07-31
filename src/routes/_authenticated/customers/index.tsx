import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Plus, Search } from 'lucide-react'

import { InitialsAvatar } from '#/components/initials-avatar'
import { AppHeader } from '#/components/loans/app-header'
import { NewCustomerModal } from '#/components/loans/new-customer-modal'
import { Sidebar } from '#/components/loans/sidebar'
import { Input } from '#/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { createCustomerFn, listCustomersFn } from '#/lib/customers/customers.functions'
import { formatDate, formatNaira } from '#/lib/loans/format'

export const Route = createFileRoute('/_authenticated/customers/')({
  loader: () => listCustomersFn(),
  component: CustomersIndex,
})

function CustomersIndex() {
  const customers = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const router = useRouter()
  const createCustomer = useServerFn(createCustomerFn)

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.fullName.toLowerCase().includes(q) || c.phoneNumber.includes(q) || (c.bvn ?? '').includes(q))
  }, [customers, search])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Customers" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Customers" />
        <main className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="relative w-[346px]">
              <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[var(--corio-neutral-400)]" />
              <Input
                placeholder="Search by customer name"
                className="h-[38px] pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-[#2970ff] px-4 py-2 text-sm font-medium text-white shadow-[0px_1px_2px_0px_rgba(55,93,251,0.08)] hover:bg-[#2970ff]/90"
            >
              <Plus className="size-5" />
              New Customer
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--corio-neutral-100)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
                  <TableHead>Name</TableHead>
                  <TableHead>BVN</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>NIN</TableHead>
                  <TableHead>Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-[var(--corio-neutral-400)]">
                      No customers yet.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: '/customers/$customerId', params: { customerId: customer.id } })}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <InitialsAvatar name={customer.fullName} className="size-8 text-xs font-medium" />
                        <span className="max-w-[120px] truncate text-sm font-medium text-[var(--corio-neutral-800)]">{customer.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--corio-neutral-800)]">{customer.bvn ?? '—'}</TableCell>
                    <TableCell className="text-sm text-[var(--corio-neutral-800)]">{customer.phoneNumber}</TableCell>
                    <TableCell className="text-sm text-[var(--corio-neutral-800)]">
                      {customer.monthlyIncome ? formatNaira(customer.monthlyIncome) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--corio-neutral-800)]">{customer.nin ?? '—'}</TableCell>
                    <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatDate(customer.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t border-[var(--corio-neutral-100)] px-6 py-3.5 text-sm text-[var(--corio-neutral-500)]">
              <span>
                Showing {filtered.length} of {customers.length}
              </span>
            </div>
          </div>
        </main>
      </div>

      <NewCustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreate={async (form) => {
          const customer = await createCustomer({
            data: {
              fullName: form.fullName,
              phoneNumber: form.phoneNumber,
              email: form.email,
              bvn: form.bvn || undefined,
              nin: form.nin || undefined,
              employmentType: form.employmentType || undefined,
              employerName: form.employerName || undefined,
              businessName: form.businessName || undefined,
              monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : undefined,
              guarantorName: form.guarantorName || undefined,
              guarantorPhone: form.guarantorPhone || undefined,
            },
          })
          setLastCreatedId(customer.id)
          await router.invalidate()
        }}
        onContinue={() => {
          if (lastCreatedId) navigate({ to: '/customers/$customerId', params: { customerId: lastCreatedId } })
        }}
      />
    </div>
  )
}
