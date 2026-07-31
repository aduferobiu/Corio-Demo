import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import { RoleBadge } from '#/components/settings/role-badge'
import { EmptyState } from '#/components/settings/empty-state'
import { TeamUserModal } from '#/components/settings/team-user-modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import type { Role } from '#/lib/auth/types'
import { formatDate, formatElapsed } from '#/lib/loans/format'
import { createTeamMemberFn, deleteTeamMemberFn, updateTeamMemberFn } from '#/lib/settings/teams.functions'

type TeamMember = {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'pending'
  lastActivityAt: Date | null
  createdAt: Date
}

export function TeamsTab({ initialMembers, currentUserId }: { initialMembers: TeamMember[]; currentUserId: string }) {
  const router = useRouter()
  const createMember = useServerFn(createTeamMemberFn)
  const updateMember = useServerFn(updateTeamMemberFn)
  const deleteMember = useServerFn(deleteTeamMemberFn)

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [deleting, setDeleting] = useState<TeamMember | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  async function handleDelete() {
    if (!deleting) return
    setDeleteSubmitting(true)
    try {
      await deleteMember({ data: { id: deleting.id } })
      await router.invalidate()
      toast.success('User deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--corio-neutral-200)] bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-[var(--corio-neutral-900)]">Teams</p>
          <p className="text-sm text-[var(--corio-neutral-400)]">Manage your team members and their permissions</p>
        </div>
        {initialMembers.length > 0 && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New User
          </Button>
        )}
      </div>

      {initialMembers.length === 0 ? (
        <EmptyState title="No User Yet" description="There are no users at the moment" actionLabel="New User" onAction={() => setCreateOpen(true)} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--corio-neutral-100)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--corio-neutral-100)] text-xs font-medium text-[var(--corio-neutral-600)]">
                        {member.name
                          .split(' ')
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--corio-neutral-800)]">{member.name}</span>
                        <span className="text-xs text-[var(--corio-neutral-400)]">{member.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={member.role} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        member.status === 'active'
                          ? 'inline-flex items-center rounded-full bg-[var(--corio-green-light)] px-2 py-0.5 text-xs font-medium text-[var(--corio-green-darker)]'
                          : 'inline-flex items-center rounded-full bg-[var(--corio-yellow-light)] px-2 py-0.5 text-xs font-medium text-[var(--corio-yellow-darker)]'
                      }
                    >
                      {member.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--corio-neutral-800)]">
                    {member.lastActivityAt ? formatElapsed(member.lastActivityAt) + ' ago' : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--corio-neutral-800)]">{formatDate(member.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => setEditing(member)}
                        className="rounded-md p-1.5 text-[var(--corio-neutral-400)] hover:bg-[var(--corio-neutral-100)] hover:text-[var(--corio-blue-500)]"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={member.id === currentUserId}
                        onClick={() => setDeleting(member)}
                        className="rounded-md p-1.5 text-[var(--corio-neutral-400)] hover:bg-[var(--corio-neutral-100)] hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-[var(--corio-neutral-100)] px-6 py-3.5 text-sm text-[var(--corio-neutral-500)]">
            <span>
              Showing {initialMembers.length} of {initialMembers.length}
            </span>
          </div>
        </div>
      )}

      <TeamUserModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSubmit={async (value) => {
          try {
            await createMember({ data: value })
            await router.invalidate()
            toast.success('User successfully created')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create user')
            throw err
          }
        }}
      />

      <TeamUserModal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        mode="edit"
        initial={editing ? { name: editing.name, email: editing.email, role: editing.role } : undefined}
        onSubmit={async (value) => {
          if (!editing) return
          try {
            await updateMember({ data: { id: editing.id, name: value.name, role: value.role } })
            await router.invalidate()
            toast.success('Changes saved')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save changes')
            throw err
          }
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>Please confirm you want to delete this user</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteSubmitting}
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
            >
              {deleteSubmitting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
