import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { AlertTriangle, FileText, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import { AppHeader } from '#/components/loans/app-header'
import { Sidebar } from '#/components/loans/sidebar'
import { DocumentDetailModal } from '#/components/documents/document-detail-modal'
import { NewDocumentModal } from '#/components/documents/new-document-modal'
import { PendingApprovalModal } from '#/components/documents/pending-approval-modal'
import { Input } from '#/components/ui/input'
import { formatElapsed } from '#/lib/loans/format'
import {
  approveCompanyDocumentFn,
  bulkDecidePendingFn,
  createCompanyDocumentFn,
  deleteCompanyDocumentFn,
  getCompanyDocumentFn,
  listCompanyDocumentsFn,
  rejectCompanyDocumentFn,
  uploadNewVersionFn,
} from '#/lib/documents/documents.functions'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_authenticated/documents')({
  loader: () => listCompanyDocumentsFn(),
  component: DocumentsPage,
})

const FOLDERS = [
  { value: 'all', label: 'All Document' },
  { value: 'general', label: 'General' },
  { value: 'loans', label: 'Loans' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'hr', label: 'HR' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'reports', label: 'Reports' },
] as const

function DocumentsPage() {
  const documents = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const router = useRouter()

  const createDocument = useServerFn(createCompanyDocumentFn)
  const uploadNewVersion = useServerFn(uploadNewVersionFn)
  const deleteDocument = useServerFn(deleteCompanyDocumentFn)
  const approveDocument = useServerFn(approveCompanyDocumentFn)
  const rejectDocument = useServerFn(rejectCompanyDocumentFn)
  const bulkDecide = useServerFn(bulkDecidePendingFn)
  const getDocument = useServerFn(getCompanyDocumentFn)

  const [folder, setFolder] = useState<(typeof FOLDERS)[number]['value']>('all')
  const [search, setSearch] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState(false)
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getCompanyDocumentFn>> | null>(null)

  const canManageAll = user!.role === 'md' || user!.role === 'admin'

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (folder !== 'all' && d.folder !== folder) return false
      if (search.trim() && !d.name.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
  }, [documents, folder, search])

  const pending = documents.filter((d) => d.status === 'pending')

  async function openDetail(id: string) {
    const data = await getDocument({ data: { id } })
    setDetail(data)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Documents" />

      <div className="flex w-[220px] shrink-0 flex-col gap-1 border-r border-[var(--corio-neutral-100)] bg-white py-6">
        <p className="px-6 pb-2 text-[11px] font-medium tracking-wider text-[var(--corio-neutral-400)] uppercase">Documents</p>
        {FOLDERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFolder(f.value)}
            className={cn(
              'mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
              folder === f.value ? 'bg-[#eff4ff] text-[#2970ff]' : 'text-[var(--corio-neutral-600)] hover:bg-[var(--corio-neutral-100)]',
            )}
          >
            <FileText className="size-4 shrink-0" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Documents" />
        <main className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium text-[var(--corio-neutral-900)]">
              {folder === 'all' ? 'All Documents' : FOLDERS.find((f) => f.value === folder)?.label}
            </h1>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-[#2970ff] px-4 py-2 text-sm font-medium text-white shadow-[0px_1px_2px_0px_rgba(55,93,251,0.08)] hover:bg-[#2970ff]/90"
            >
              <Plus className="size-5" />
              New Document
            </button>
          </div>

          <div className="relative w-[346px]">
            <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[var(--corio-neutral-400)]" />
            <Input placeholder="Search documents, applicants or reference numbers" className="h-[38px] pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {pending.length > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-[var(--corio-yellow-light)]/60 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[var(--corio-yellow-darker)]">
                <AlertTriangle className="size-4 shrink-0" />
                {pending.length} Document{pending.length === 1 ? '' : 's'} awaiting admin approval
              </div>
              <button type="button" onClick={() => setPendingOpen(true)} className="text-sm font-medium text-[#155eef] underline">
                View Document
              </button>
            </div>
          )}

          <p className="text-sm text-[var(--corio-neutral-400)]">
            {filtered.length} document{filtered.length === 1 ? '' : 's'} · sorted by date filed
          </p>

          {filtered.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-16 text-sm text-[var(--corio-neutral-400)]">No documents found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => openDetail(doc.id)}
                  className="flex items-center gap-3 rounded-xl border border-[var(--corio-neutral-200)] bg-white p-4 text-left hover:border-[var(--corio-blue-500)]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--corio-neutral-100)] text-destructive">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-[var(--corio-neutral-900)]">{doc.name}</span>
                    <span className="truncate text-xs text-[var(--corio-neutral-400)]">
                      {doc.ownerName} · Filed {formatElapsed(doc.updatedAt)} ago
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      <NewDocumentModal
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={async (form) => {
          const formData = new FormData()
          formData.set('name', form.name)
          formData.set('folder', form.folder)
          formData.set('file', form.file)
          try {
            await createDocument({ data: formData })
            await router.invalidate()
            toast.success('Document uploaded successfully. Awaiting Admin approval')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to upload document')
            throw err
          }
        }}
      />

      {detail && (
        <DocumentDetailModal
          data={detail}
          canDelete={canManageAll || detail.document.ownerUserId === user!.id}
          onClose={() => setDetail(null)}
          onUploadNewVersion={async (file) => {
            const formData = new FormData()
            formData.set('documentId', detail.document.id)
            formData.set('file', file)
            await uploadNewVersion({ data: formData })
            const refreshed = await getDocument({ data: { id: detail.document.id } })
            setDetail(refreshed)
            await router.invalidate()
            toast.success('New version uploaded')
          }}
          onDelete={async () => {
            await deleteDocument({ data: { id: detail.document.id } })
            setDetail(null)
            await router.invalidate()
            toast.success('Document deleted')
          }}
        />
      )}

      <PendingApprovalModal
        open={pendingOpen}
        onClose={() => setPendingOpen(false)}
        documents={pending}
        canDecide={canManageAll}
        onApprove={async (id) => {
          await approveDocument({ data: { id } })
          await router.invalidate()
          toast.success('Document approved successfully')
        }}
        onReject={async (id) => {
          await rejectDocument({ data: { id } })
          await router.invalidate()
          toast.success('Document rejected')
        }}
        onBulkDecide={async (decision) => {
          await bulkDecide({ data: { decision } })
          await router.invalidate()
          setPendingOpen(false)
          toast.success(decision === 'approved' ? 'All documents approved' : 'All documents rejected')
        }}
        onUploadNewVersion={async (id, file) => {
          const formData = new FormData()
          formData.set('documentId', id)
          formData.set('file', file)
          await uploadNewVersion({ data: formData })
          await router.invalidate()
          toast.success('New version uploaded')
        }}
        onDelete={async (id) => {
          await deleteDocument({ data: { id } })
          await router.invalidate()
          toast.success('Document deleted')
        }}
      />
    </div>
  )
}
