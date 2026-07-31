import { desc, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db/client'
import { companyDocumentActivity, companyDocumentVersions, companyDocuments, users } from '#/db/schema'
import { authMiddleware, requireRole } from '#/lib/auth/middleware'

const FOLDERS = ['general', 'loans', 'contracts', 'invoices', 'hr', 'compliance', 'reports'] as const

function canManage(role: string) {
  return role === 'md' || role === 'admin'
}

export const listCompanyDocumentsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const rows = await db
      .select({ doc: companyDocuments, owner: users })
      .from(companyDocuments)
      .innerJoin(users, eq(users.id, companyDocuments.ownerUserId))
      .orderBy(desc(companyDocuments.updatedAt))

    const allVersions = await db.select().from(companyDocumentVersions)
    const latestByDoc = new Map<string, (typeof allVersions)[number]>()
    for (const v of allVersions) {
      const existing = latestByDoc.get(v.documentId)
      if (!existing || v.version > existing.version) latestByDoc.set(v.documentId, v)
    }

    return rows.map((r) => {
      const latest = latestByDoc.get(r.doc.id)
      return {
        ...r.doc,
        ownerName: r.owner.name,
        latestFileName: latest?.fileName ?? null,
        latestDataUrl: latest?.dataUrl ?? null,
        latestMimeType: latest?.mimeType ?? null,
        latestFileSize: latest?.fileSize ?? null,
      }
    })
  })

export const getCompanyDocumentFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const [row] = await db
      .select({ doc: companyDocuments, owner: users })
      .from(companyDocuments)
      .innerJoin(users, eq(users.id, companyDocuments.ownerUserId))
      .where(eq(companyDocuments.id, data.id))
      .limit(1)
    if (!row) throw new Error('Not found')

    let approverName: string | null = null
    if (row.doc.approvedByUserId) {
      const [approver] = await db.select().from(users).where(eq(users.id, row.doc.approvedByUserId)).limit(1)
      approverName = approver?.name ?? null
    }

    const versions = await db
      .select({ version: companyDocumentVersions, uploader: users })
      .from(companyDocumentVersions)
      .innerJoin(users, eq(users.id, companyDocumentVersions.uploadedByUserId))
      .where(eq(companyDocumentVersions.documentId, data.id))
      .orderBy(desc(companyDocumentVersions.version))

    const activity = await db
      .select({ entry: companyDocumentActivity, actor: users })
      .from(companyDocumentActivity)
      .innerJoin(users, eq(users.id, companyDocumentActivity.actorUserId))
      .where(eq(companyDocumentActivity.documentId, data.id))
      .orderBy(desc(companyDocumentActivity.createdAt))

    return {
      document: { ...row.doc, ownerName: row.owner.name, approverName },
      versions: versions.map((v) => ({ ...v.version, uploaderName: v.uploader.name })),
      activity: activity.map((a) => ({ ...a.entry, actorName: a.actor.name })),
    }
  })

export const createCompanyDocumentFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) throw new Error('Expected FormData')
    const name = formData.get('name')
    const folder = formData.get('folder')
    const file = formData.get('file')
    if (typeof name !== 'string' || !name.trim()) throw new Error('Document name is required')
    if (!(file instanceof File) || file.size === 0) throw new Error('A file is required')
    const parsedFolder = FOLDERS.includes(folder as (typeof FOLDERS)[number]) ? (folder as (typeof FOLDERS)[number]) : 'general'
    return { name: name.trim(), folder: parsedFolder, file }
  })
  .handler(async ({ context, data }) => {
    const { writeUploadedFile, fileToDataUrl } = await import('#/lib/documents/storage.server')

    // MD/admin are the ones who approve everyone else's documents, so their own
    // uploads don't need to sit in the approval queue for themselves.
    const autoApprove = canManage(context.user.role)

    const [document] = await db
      .insert(companyDocuments)
      .values({
        name: data.name,
        folder: data.folder,
        ownerUserId: context.user.id,
        status: autoApprove ? 'approved' : 'pending',
        approvedByUserId: autoApprove ? context.user.id : null,
      })
      .returning()

    const [storedPath, dataUrl] = await Promise.all([
      writeUploadedFile(`company-documents/${document.id}`, data.file),
      fileToDataUrl(data.file),
    ])

    await db.insert(companyDocumentVersions).values({
      documentId: document.id,
      version: 1,
      fileName: data.file.name,
      storedPath,
      dataUrl,
      mimeType: data.file.type || 'application/octet-stream',
      fileSize: data.file.size,
      uploadedByUserId: context.user.id,
    })

    await db.insert(companyDocumentActivity).values({
      documentId: document.id,
      actorUserId: context.user.id,
      action: 'created',
    })
    if (autoApprove) {
      await db.insert(companyDocumentActivity).values({
        documentId: document.id,
        actorUserId: context.user.id,
        action: 'approved',
        detail: 'Auto-approved',
      })
    }

    return document
  })

export const uploadNewVersionFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) throw new Error('Expected FormData')
    const documentId = formData.get('documentId')
    const file = formData.get('file')
    if (typeof documentId !== 'string') throw new Error('Invalid document')
    if (!(file instanceof File) || file.size === 0) throw new Error('A file is required')
    return { documentId, file }
  })
  .handler(async ({ context, data }) => {
    const [document] = await db.select().from(companyDocuments).where(eq(companyDocuments.id, data.documentId)).limit(1)
    if (!document) throw new Error('Not found')

    const { writeUploadedFile, fileToDataUrl } = await import('#/lib/documents/storage.server')
    const nextVersion = document.currentVersion + 1
    const [storedPath, dataUrl] = await Promise.all([
      writeUploadedFile(`company-documents/${document.id}`, data.file),
      fileToDataUrl(data.file),
    ])

    await db.insert(companyDocumentVersions).values({
      documentId: document.id,
      version: nextVersion,
      fileName: data.file.name,
      storedPath,
      dataUrl,
      mimeType: data.file.type || 'application/octet-stream',
      fileSize: data.file.size,
      uploadedByUserId: context.user.id,
    })

    const autoApprove = canManage(context.user.role)

    await db
      .update(companyDocuments)
      .set({
        currentVersion: nextVersion,
        status: autoApprove ? 'approved' : 'pending',
        approvedByUserId: autoApprove ? context.user.id : null,
        updatedAt: new Date(),
      })
      .where(eq(companyDocuments.id, document.id))

    await db.insert(companyDocumentActivity).values({
      documentId: document.id,
      actorUserId: context.user.id,
      action: 'uploaded_version',
      detail: `Uploaded version ${nextVersion}`,
    })
    if (autoApprove) {
      await db.insert(companyDocumentActivity).values({
        documentId: document.id,
        actorUserId: context.user.id,
        action: 'approved',
        detail: 'Auto-approved',
      })
    }

    return { ok: true }
  })

export const deleteCompanyDocumentFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const [document] = await db.select().from(companyDocuments).where(eq(companyDocuments.id, data.id)).limit(1)
    if (!document) throw new Error('Not found')
    if (document.ownerUserId !== context.user.id && !canManage(context.user.role)) {
      throw new Error('Only the owner or an admin can delete this document')
    }

    await db.delete(companyDocumentActivity).where(eq(companyDocumentActivity.documentId, data.id))
    await db.delete(companyDocumentVersions).where(eq(companyDocumentVersions.documentId, data.id))
    await db.delete(companyDocuments).where(eq(companyDocuments.id, data.id))

    return { ok: true }
  })

export const approveCompanyDocumentFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md', 'admin')])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await db
      .update(companyDocuments)
      .set({ status: 'approved', approvedByUserId: context.user.id, updatedAt: new Date() })
      .where(eq(companyDocuments.id, data.id))
    await db.insert(companyDocumentActivity).values({ documentId: data.id, actorUserId: context.user.id, action: 'approved' })
    return { ok: true }
  })

export const rejectCompanyDocumentFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md', 'admin')])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await db
      .update(companyDocuments)
      .set({ status: 'rejected', approvedByUserId: context.user.id, updatedAt: new Date() })
      .where(eq(companyDocuments.id, data.id))
    await db.insert(companyDocumentActivity).values({ documentId: data.id, actorUserId: context.user.id, action: 'rejected' })
    return { ok: true }
  })

export const bulkDecidePendingFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md', 'admin')])
  .validator(z.object({ decision: z.enum(['approved', 'rejected']) }))
  .handler(async ({ context, data }) => {
    const pending = await db.select().from(companyDocuments).where(eq(companyDocuments.status, 'pending'))
    for (const doc of pending) {
      await db
        .update(companyDocuments)
        .set({ status: data.decision, approvedByUserId: context.user.id, updatedAt: new Date() })
        .where(eq(companyDocuments.id, doc.id))
      await db.insert(companyDocumentActivity).values({
        documentId: doc.id,
        actorUserId: context.user.id,
        action: data.decision === 'approved' ? 'approved' : 'rejected',
      })
    }
    return { ok: true, count: pending.length }
  })
