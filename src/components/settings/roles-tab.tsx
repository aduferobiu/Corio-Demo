import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/settings/empty-state'
import { RoleForm, type RoleFormValue } from '#/components/settings/role-form'
import { createRoleFn, deleteRoleFn, updateRoleFn } from '#/lib/settings/roles.functions'

type RoleRow = { id: string; name: string; permissions: string[] }

export function RolesTab({ initialRoles }: { initialRoles: RoleRow[] }) {
  const router = useRouter()
  const createRole = useServerFn(createRoleFn)
  const updateRole = useServerFn(updateRoleFn)
  const deleteRole = useServerFn(deleteRoleFn)

  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null)
  const [deleting, setDeleting] = useState<RoleRow | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  async function handleCreate(value: RoleFormValue) {
    try {
      await createRole({ data: value })
      await router.invalidate()
      toast.success('Role created')
      setView('list')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create role')
    }
  }

  async function handleEdit(value: RoleFormValue) {
    if (!editingRole) return
    try {
      await updateRole({ data: { id: editingRole.id, ...value } })
      await router.invalidate()
      toast.success('Role updated')
      setView('list')
      setEditingRole(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteSubmitting(true)
    try {
      await deleteRole({ data: { id: deleting.id } })
      await router.invalidate()
      toast.success('Role deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  if (view === 'create') {
    return <RoleForm mode="create" onClose={() => setView('list')} onSubmit={handleCreate} />
  }

  if (view === 'edit' && editingRole) {
    return (
      <RoleForm
        mode="edit"
        initial={{ name: editingRole.name, permissions: editingRole.permissions }}
        onClose={() => {
          setView('list')
          setEditingRole(null)
        }}
        onSubmit={handleEdit}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--corio-neutral-200)] bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-[var(--corio-neutral-900)]">Roles &amp; Permissions</p>
          <p className="text-sm text-[var(--corio-neutral-400)]">Role definitions for your team. Permissions are for reference only.</p>
        </div>
        {initialRoles.length > 0 && (
          <Button size="sm" onClick={() => setView('create')}>
            <Plus className="size-4" />
            New Role
          </Button>
        )}
      </div>

      {initialRoles.length === 0 ? (
        <EmptyState title="No Roles Yet" description="There are no roles at the moment" actionLabel="New Role" onAction={() => setView('create')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {initialRoles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-[var(--corio-neutral-100)] p-4"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--corio-neutral-900)]">{role.name}</p>
                <p className="text-xs text-[var(--corio-neutral-400)]">
                  {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Edit"
                  onClick={() => {
                    setEditingRole(role)
                    setView('edit')
                  }}
                  className="flex size-7 items-center justify-center rounded-md border border-[var(--corio-blue-500)] text-[var(--corio-blue-500)] hover:bg-white"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete"
                  onClick={() => setDeleting(role)}
                  className="flex size-7 items-center justify-center rounded-md border border-destructive text-destructive hover:bg-white"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>Please confirm you want to delete this role</AlertDialogDescription>
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
