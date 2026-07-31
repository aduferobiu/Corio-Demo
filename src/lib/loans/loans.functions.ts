import { desc, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db/client'
import { comments, customers, documents, loanApplications, loanStatusHistory, users } from '#/db/schema'
import { authMiddleware, requireRole } from '#/lib/auth/middleware'

function generateReferenceNumber() {
  const year = new Date().getFullYear()
  const suffix = Math.floor(10000 + Math.random() * 90000)
  return `COR-${year}-${suffix}`
}

export const listMyApplicationsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.createdByUserId, context.user.id))
      .orderBy(desc(loanApplications.createdAt))
  })

export const getApplicationFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.id)).limit(1)
    if (!application) throw new Error('Not found')
    if (context.user.role === 'loan_officer' && application.createdByUserId !== context.user.id) throw new Error('Not found')

    const applicationComments = await db
      .select({ comment: comments, author: users })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.authorUserId))
      .where(eq(comments.loanApplicationId, application.id))
      .orderBy(comments.createdAt)

    const applicationDocuments = await db.select().from(documents).where(eq(documents.loanApplicationId, application.id))

    return { application, comments: applicationComments, documents: applicationDocuments }
  })

export const listCreditQueueFn = createServerFn({ method: 'GET' })
  .middleware([requireRole('credit_officer')])
  .handler(async () => {
    return db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.status, 'with_credit'))
      .orderBy(desc(loanApplications.updatedAt))
  })

export const getCreditStatsFn = createServerFn({ method: 'GET' })
  .middleware([requireRole('credit_officer')])
  .handler(async () => {
    const all = await db.select().from(loanApplications)
    const approved = all.filter((a) => a.status === 'approved')
    const rejected = all.filter((a) => a.status === 'rejected')
    const pending = all.filter((a) => a.status === 'with_credit')
    return {
      totalAmount: approved.reduce((sum, a) => sum + a.amountRequested, 0),
      totalApproved: approved.length,
      totalRejected: rejected.length,
      totalPending: pending.length,
    }
  })

const applicantSchema = z.object({
  mode: z.enum(['existing', 'new']),
  customerId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  applicantPhone: z.string().optional(),
  bvn: z.string().optional(),
  nin: z.string().optional(),
  employmentType: z.enum(['employed', 'self_employed']).optional(),
  employerName: z.string().optional(),
  businessName: z.string().optional(),
  monthlyIncome: z.coerce.number().int().nonnegative().optional(),
  guarantorName: z.string().min(1),
  guarantorPhone: z.string().min(1),
  loanType: z.enum(['business_loan', 'personal_loan']),
  amountRequested: z.coerce.number().int().positive(),
  loanPurpose: z.string().optional(),
  loanDurationMonths: z.coerce.number().int().positive(),
  interestRateBps: z.coerce.number().int().nonnegative(),
  totalAmountDue: z.coerce.number().int().nonnegative(),
})

export const createApplicationFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('loan_officer')])
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) throw new Error('Expected FormData')
    const raw = Object.fromEntries(formData.entries())
    const fields = applicantSchema.parse(raw)
    const files = formData.getAll('files') as File[]
    const fileLabels = formData.getAll('fileLabels') as string[]
    return { fields, files, fileLabels }
  })
  .handler(async ({ context, data }) => {
    const { fields, files, fileLabels } = data

    let customerId: string
    let applicantName: string
    let applicantPhone: string
    let bvn: string | null
    let employmentType: 'employed' | 'self_employed' | null
    let employerName: string | null
    let businessName: string | null
    let monthlyIncome: number | null

    if (fields.mode === 'existing') {
      if (!fields.customerId) throw new Error('Select a customer')
      const [customer] = await db.select().from(customers).where(eq(customers.id, fields.customerId)).limit(1)
      if (!customer) throw new Error('Customer not found')
      customerId = customer.id
      applicantName = customer.fullName
      applicantPhone = customer.phoneNumber
      bvn = customer.bvn
      employmentType = customer.employmentType
      employerName = customer.employerName
      businessName = customer.businessName
      monthlyIncome = customer.monthlyIncome
    } else {
      applicantName = `${fields.firstName ?? ''} ${fields.lastName ?? ''}`.trim()
      applicantPhone = fields.applicantPhone ?? ''
      bvn = fields.bvn || null
      employmentType = fields.employmentType ?? null
      employerName = fields.employerName || null
      businessName = fields.businessName || null
      monthlyIncome = fields.monthlyIncome ?? null
      if (!applicantName || !applicantPhone) throw new Error('Applicant name and phone are required')

      const [customer] = await db
        .insert(customers)
        .values({
          fullName: applicantName,
          phoneNumber: applicantPhone,
          bvn,
          nin: fields.nin || null,
          employmentType,
          employerName,
          businessName,
          monthlyIncome,
          guarantorName: fields.guarantorName,
          guarantorPhone: fields.guarantorPhone,
          createdByUserId: context.user.id,
        })
        .returning()
      customerId = customer.id
    }

    const [application] = await db
      .insert(loanApplications)
      .values({
        customerId,
        applicantName,
        applicantPhone,
        bvn,
        employmentType,
        employerName,
        businessName,
        monthlyIncome,
        guarantorName: fields.guarantorName,
        guarantorPhone: fields.guarantorPhone,
        loanType: fields.loanType,
        amountRequested: fields.amountRequested,
        loanPurpose: fields.loanPurpose,
        loanDurationMonths: fields.loanDurationMonths,
        interestRateBps: fields.interestRateBps,
        totalAmountDue: fields.totalAmountDue,
        referenceNumber: generateReferenceNumber(),
        branch: context.user.branch,
        createdByUserId: context.user.id,
        status: 'submitted',
        submittedAt: new Date(),
      })
      .returning()

    await db.insert(loanStatusHistory).values({
      loanApplicationId: application.id,
      fromStatus: null,
      toStatus: 'submitted',
      actorUserId: context.user.id,
    })

    const { writeUploadedFile } = await import('#/lib/documents/storage.server')
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file || file.size === 0) continue
      const storedPath = await writeUploadedFile(application.id, file)
      await db.insert(documents).values({
        loanApplicationId: application.id,
        uploadedByUserId: context.user.id,
        fileName: file.name,
        storedPath,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        documentType: fileLabels[i] ?? 'other',
      })
    }

    return application
  })

// Open to any authenticated role. Posting alternates the thread between "query" and
// "response": if the application isn't already queried, this raises a query (parking the
// application and remembering its status so it can be restored); if it is already queried,
// this posts a response and restores the application to wherever it was before the query.
// Accepts an optional file attachment alongside the message.
export const postQueryMessageFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) throw new Error('Expected FormData')
    const applicationId = formData.get('applicationId')
    const body = formData.get('body')
    if (typeof applicationId !== 'string' || typeof body !== 'string' || !body.trim()) {
      throw new Error('Invalid query message')
    }
    const file = formData.get('file')
    return { applicationId, body, file: file instanceof File && file.size > 0 ? file : null }
  })
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.applicationId)).limit(1)
    if (!application) throw new Error('Not found')
    if (context.user.role === 'loan_officer' && application.createdByUserId !== context.user.id) throw new Error('Not found')
    if (['approved', 'rejected', 'declined'].includes(application.status)) {
      throw new Error('A decision has already been made on this application')
    }

    const isRaisingQuery = application.status !== 'queried'

    const [comment] = await db
      .insert(comments)
      .values({
        loanApplicationId: application.id,
        authorUserId: context.user.id,
        type: isRaisingQuery ? 'query' : 'response',
        body: data.body,
      })
      .returning()

    if (data.file) {
      const { writeUploadedFile, fileToDataUrl } = await import('#/lib/documents/storage.server')
      const [storedPath, dataUrl] = await Promise.all([writeUploadedFile(application.id, data.file), fileToDataUrl(data.file)])
      await db.insert(documents).values({
        loanApplicationId: application.id,
        commentId: comment.id,
        uploadedByUserId: context.user.id,
        fileName: data.file.name,
        storedPath,
        dataUrl,
        mimeType: data.file.type || 'application/octet-stream',
        fileSize: data.file.size,
        documentType: 'Query Attachment',
      })
    }

    const toStatus = isRaisingQuery ? 'queried' : (application.preQueryStatus ?? application.status)

    await db
      .update(loanApplications)
      .set({
        status: toStatus,
        preQueryStatus: isRaisingQuery ? application.status : null,
        updatedAt: new Date(),
      })
      .where(eq(loanApplications.id, application.id))

    await db.insert(loanStatusHistory).values({
      loanApplicationId: application.id,
      fromStatus: application.status,
      toStatus,
      actorUserId: context.user.id,
    })

    return { ok: true }
  })

export const approveByCreditFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('credit_officer')])
  .validator(z.object({ applicationId: z.string(), notes: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.applicationId)).limit(1)
    if (!application) throw new Error('Not found')
    if (application.status !== 'with_credit') throw new Error('Application is not awaiting credit review')

    await db
      .update(loanApplications)
      .set({
        status: 'approved',
        decidedByUserId: context.user.id,
        decisionNotes: data.notes || null,
        decidedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loanApplications.id, application.id))

    await db.insert(loanStatusHistory).values({
      loanApplicationId: application.id,
      fromStatus: 'with_credit',
      toStatus: 'approved',
      actorUserId: context.user.id,
      note: data.notes,
    })

    return { ok: true }
  })

export const rejectByCreditFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('credit_officer')])
  .validator(z.object({ applicationId: z.string(), notes: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.applicationId)).limit(1)
    if (!application) throw new Error('Not found')
    if (application.status !== 'with_credit') throw new Error('Application is not awaiting credit review')

    await db
      .update(loanApplications)
      .set({
        status: 'rejected',
        decidedByUserId: context.user.id,
        decisionNotes: data.notes,
        decidedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loanApplications.id, application.id))

    await db.insert(loanStatusHistory).values({
      loanApplicationId: application.id,
      fromStatus: 'with_credit',
      toStatus: 'rejected',
      actorUserId: context.user.id,
      note: data.notes,
    })

    return { ok: true }
  })

export const approveByBranchFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('branch_officer')])
  .validator(z.object({ applicationId: z.string(), notes: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.applicationId)).limit(1)
    if (!application) throw new Error('Not found')
    if (application.status !== 'submitted') throw new Error('Application is not awaiting branch review')

    await db
      .update(loanApplications)
      .set({ status: 'with_credit', updatedAt: new Date() })
      .where(eq(loanApplications.id, application.id))

    await db.insert(loanStatusHistory).values({
      loanApplicationId: application.id,
      fromStatus: 'submitted',
      toStatus: 'with_credit',
      actorUserId: context.user.id,
      note: data.notes,
    })

    return { ok: true }
  })

export const declineByBranchFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('branch_officer')])
  .validator(z.object({ applicationId: z.string(), notes: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.applicationId)).limit(1)
    if (!application) throw new Error('Not found')
    if (application.status !== 'submitted') throw new Error('Application is not awaiting branch review')

    await db
      .update(loanApplications)
      .set({
        status: 'declined',
        decidedByUserId: context.user.id,
        decisionNotes: data.notes,
        decidedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loanApplications.id, application.id))

    await db.insert(loanStatusHistory).values({
      loanApplicationId: application.id,
      fromStatus: 'submitted',
      toStatus: 'declined',
      actorUserId: context.user.id,
      note: data.notes,
    })

    return { ok: true }
  })

// Illustrative — marks the analysis as "run" so the UI can switch from
// "Run Analysis" to "View Report". The report itself is always derived
// deterministically from the application's declared figures (see bank-analysis.ts).
export const runBankAnalysisFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('branch_officer')])
  .validator(z.object({ applicationId: z.string() }))
  .handler(async ({ data }) => {
    const [application] = await db
      .update(loanApplications)
      .set({ bankAnalysisRunAt: new Date() })
      .where(eq(loanApplications.id, data.applicationId))
      .returning()
    if (!application) throw new Error('Not found')
    return application
  })
