import { and, desc, eq, like, or } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db/client'
import { comments, customers, documents, loanApplications, loanStatusHistory, notifications, users } from '#/db/schema'
import { authMiddleware, requireRole } from '#/lib/auth/middleware'
import { ROLE_APPLICATION_DETAIL } from '#/lib/auth/role-routes'
import { ATTACHMENT_TYPES } from '#/lib/loans/attachment-types'

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

// Branch officers see every application submitted at their branch (read-only —
// they can't create new applications, only review/decide on them).
export const listBranchApplicationsFn = createServerFn({ method: 'GET' })
  .middleware([requireRole('branch_officer')])
  .handler(async ({ context }) => {
    return db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.branch, context.user.branch ?? ''))
      .orderBy(desc(loanApplications.createdAt))
  })

// MD sees every application company-wide (read-only, sorted by most recently
// active so "time at stage" is meaningful).
export const listAllApplicationsFn = createServerFn({ method: 'GET' })
  .middleware([requireRole('md')])
  .handler(async () => {
    return db.select().from(loanApplications).orderBy(desc(loanApplications.updatedAt))
  })

export const getApplicationFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.id)).limit(1)
    if (!application) throw new Error('Not found')
    if (['loan_officer', 'admin'].includes(context.user.role) && application.createdByUserId !== context.user.id) {
      throw new Error('Not found')
    }

    const [applicationComments, applicationDocuments, history, unreadQueryNotifications] = await Promise.all([
      db
        .select({ comment: comments, author: users })
        .from(comments)
        .innerJoin(users, eq(users.id, comments.authorUserId))
        .where(eq(comments.loanApplicationId, application.id))
        .orderBy(comments.createdAt),
      db.select().from(documents).where(eq(documents.loanApplicationId, application.id)),
      db
        .select({ entry: loanStatusHistory, actor: users })
        .from(loanStatusHistory)
        .innerJoin(users, eq(users.id, loanStatusHistory.actorUserId))
        .where(eq(loanStatusHistory.loanApplicationId, application.id))
        .orderBy(loanStatusHistory.createdAt),
      db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, context.user.id),
            eq(notifications.read, false),
            or(eq(notifications.type, 'query_raised'), eq(notifications.type, 'query_response')),
            like(notifications.link, `%/${application.id}`),
          ),
        )
        .limit(1),
    ])

    return {
      application,
      comments: applicationComments,
      documents: applicationDocuments,
      history: history.map((h) => ({ ...h.entry, actorName: h.actor.name, actorRole: h.actor.role })),
      hasUnreadQuery: unreadQueryNotifications.length > 0,
    }
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
    const declined = all.filter((a) => a.status === 'declined')
    const pending = all.filter((a) => a.status === 'with_credit')
    return {
      totalAmount: approved.reduce((sum, a) => sum + a.amountRequested, 0),
      totalApproved: approved.length,
      totalDeclined: declined.length,
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
  .middleware([requireRole('loan_officer', 'admin')])
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

    const { writeUploadedFile, fileToDataUrl } = await import('#/lib/documents/storage.server')
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file || file.size === 0) continue
      const [storedPath, dataUrl] = await Promise.all([writeUploadedFile(application.id, file), fileToDataUrl(file)])
      await db.insert(documents).values({
        loanApplicationId: application.id,
        uploadedByUserId: context.user.id,
        fileName: file.name,
        storedPath,
        dataUrl,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        documentType: fileLabels[i] ?? 'other',
      })
    }

    // Newly submitted applications are first in the branch officer's queue —
    // let them know a task is waiting on them.
    const branchOfficers = await db.select().from(users).where(and(eq(users.role, 'branch_officer'), eq(users.branch, application.branch ?? '')))
    if (branchOfficers.length > 0) {
      const { createNotification } = await import('#/lib/notifications/create-notification.server')
      await Promise.all(
        branchOfficers.map((u) =>
          createNotification({
            userId: u.id,
            type: 'loan_activity',
            title: 'New application awaiting review',
            body: `${application.referenceNumber} — ${application.applicantName} was submitted and is awaiting your review`,
            link: `/branch-officer/${application.id}`,
          }),
        ),
      )
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
    if (['loan_officer', 'admin'].includes(context.user.role) && application.createdByUserId !== context.user.id) {
      throw new Error('Not found')
    }
    if (['approved', 'declined'].includes(application.status)) {
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

    // Only whoever needs to act next gets notified — not every role with
    // eventual visibility into the application. Raising a query always waits on
    // the loan officer to respond; a response hands the thread back to whichever
    // stage the application is resuming at (read from the pre-query snapshot,
    // since `application` here is still the state before this update).
    const allUsers = await db.select().from(users)
    const recipients = new Map<string, (typeof allUsers)[number]>()
    const addRecipient = (u: (typeof allUsers)[number]) => {
      if (u.id !== context.user.id) recipients.set(u.id, u)
    }

    if (isRaisingQuery) {
      const creator = allUsers.find((u) => u.id === application.createdByUserId)
      if (creator) addRecipient(creator)
    } else {
      const resumeStatus = application.preQueryStatus
      for (const u of allUsers) {
        if (resumeStatus === 'submitted' && u.role === 'branch_officer' && u.branch === application.branch) addRecipient(u)
        if (resumeStatus === 'with_credit' && u.role === 'credit_officer') addRecipient(u)
      }
    }
    // Admin keeps full cross-stage oversight regardless of who currently owns it.
    // MD is deliberately excluded — MD can act on any application but shouldn't
    // be paged on every query unless they're the one who needs to respond.
    for (const u of allUsers) {
      if (u.role === 'admin') addRecipient(u)
    }

    if (recipients.size > 0) {
      const { createNotification } = await import('#/lib/notifications/create-notification.server')
      await Promise.all(
        Array.from(recipients.values()).map((u) =>
          createNotification({
            userId: u.id,
            type: isRaisingQuery ? 'query_raised' : 'query_response',
            title: isRaisingQuery ? 'New query raised' : 'Reply posted to a query',
            body: `${context.user.name} ${isRaisingQuery ? 'raised a query on' : 'responded to a query on'} ${application.referenceNumber} — ${application.applicantName}`,
            link: ROLE_APPLICATION_DETAIL[u.role](application.id),
          }),
        ),
      )
    }

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

    const { createNotification } = await import('#/lib/notifications/create-notification.server')
    await createNotification({
      userId: application.createdByUserId,
      type: 'loan_activity',
      title: 'Application approved',
      body: `${application.referenceNumber} — ${application.applicantName} was approved by credit review`,
      link: `/loan-officer/${application.id}`,
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
        status: 'declined',
        decidedByUserId: context.user.id,
        decisionNotes: data.notes,
        decidedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loanApplications.id, application.id))

    await db.insert(loanStatusHistory).values({
      loanApplicationId: application.id,
      fromStatus: 'with_credit',
      toStatus: 'declined',
      actorUserId: context.user.id,
      note: data.notes,
    })

    const { createNotification } = await import('#/lib/notifications/create-notification.server')
    await createNotification({
      userId: application.createdByUserId,
      type: 'loan_activity',
      title: 'Application declined',
      body: `${application.referenceNumber} — ${application.applicantName} was declined by credit review`,
      link: `/loan-officer/${application.id}`,
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

    const statements = await db.select().from(documents).where(eq(documents.loanApplicationId, application.id))
    if (!statements.some((d) => d.documentType === 'Bank Statement')) {
      throw new Error('Upload a bank statement before approving this application')
    }

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

    const { createNotification } = await import('#/lib/notifications/create-notification.server')
    await createNotification({
      userId: application.createdByUserId,
      type: 'loan_activity',
      title: 'Application sent to credit review',
      body: `${application.referenceNumber} — ${application.applicantName} was approved by the branch and is now with credit`,
      link: `/loan-officer/${application.id}`,
    })

    // Now in the credit officer's shared queue — let them know a task is waiting.
    const creditOfficers = await db.select().from(users).where(eq(users.role, 'credit_officer'))
    await Promise.all(
      creditOfficers.map((u) =>
        createNotification({
          userId: u.id,
          type: 'loan_activity',
          title: 'New application awaiting credit review',
          body: `${application.referenceNumber} — ${application.applicantName} is now awaiting your review`,
          link: `/credit-officer/${application.id}`,
        }),
      ),
    )

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

    const { createNotification } = await import('#/lib/notifications/create-notification.server')
    await createNotification({
      userId: application.createdByUserId,
      type: 'loan_activity',
      title: 'Application declined',
      body: `${application.referenceNumber} — ${application.applicantName} was declined by the branch`,
      link: `/loan-officer/${application.id}`,
    })

    return { ok: true }
  })

// MD can step in and decide an application at any point before it's been
// finally decided — not just when it's sitting in their own queue.
const MD_DECIDABLE_STATUSES = ['submitted', 'queried', 'with_credit'] as const

export const approveByMdFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md')])
  .validator(z.object({ applicationId: z.string(), notes: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.applicationId)).limit(1)
    if (!application) throw new Error('Not found')
    if (!MD_DECIDABLE_STATUSES.includes(application.status as (typeof MD_DECIDABLE_STATUSES)[number])) {
      throw new Error('This application has already been decided')
    }

    const statements = await db.select().from(documents).where(eq(documents.loanApplicationId, application.id))
    if (!statements.some((d) => d.documentType === 'Bank Statement')) {
      throw new Error('Upload a bank statement before approving this application')
    }

    const fromStatus = application.status

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
      fromStatus,
      toStatus: 'approved',
      actorUserId: context.user.id,
      note: data.notes,
    })

    const { createNotification } = await import('#/lib/notifications/create-notification.server')
    await createNotification({
      userId: application.createdByUserId,
      type: 'loan_activity',
      title: 'Application approved',
      body: `${application.referenceNumber} — ${application.applicantName} was approved by the Managing Director`,
      link: `/loan-officer/${application.id}`,
    })

    return { ok: true }
  })

export const declineByMdFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('md')])
  .validator(z.object({ applicationId: z.string(), notes: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.applicationId)).limit(1)
    if (!application) throw new Error('Not found')
    if (!MD_DECIDABLE_STATUSES.includes(application.status as (typeof MD_DECIDABLE_STATUSES)[number])) {
      throw new Error('This application has already been decided')
    }

    const fromStatus = application.status

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
      fromStatus,
      toStatus: 'declined',
      actorUserId: context.user.id,
      note: data.notes,
    })

    const { createNotification } = await import('#/lib/notifications/create-notification.server')
    await createNotification({
      userId: application.createdByUserId,
      type: 'loan_activity',
      title: 'Application declined',
      body: `${application.referenceNumber} — ${application.applicantName} was declined by the Managing Director`,
      link: `/loan-officer/${application.id}`,
    })

    return { ok: true }
  })

// Extracts text from every uploaded bank statement PDF and runs it through
// OpenAI to produce a structured risk analysis, cached on the application so
// the report page doesn't re-run (and re-bill) the model on every view.
// Once run, the bank statement list is locked (see uploadBankStatementFn/deleteBankStatementFn).
export const runBankAnalysisFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('branch_officer')])
  .validator(z.object({ applicationId: z.string() }))
  .handler(async ({ data }) => {
    const statements = await db
      .select()
      .from(documents)
      .where(eq(documents.loanApplicationId, data.applicationId))
    const bankStatements = statements.filter((d) => d.documentType === 'Bank Statement')
    if (bankStatements.length === 0) {
      throw new Error('Upload at least one bank statement before running the analysis')
    }

    const { extractStatementText, analyzeStatementText } = await import('#/lib/loans/bank-analysis-ai.server')
    const texts = await Promise.all(
      bankStatements.map(async (doc) => {
        if (!doc.dataUrl) return ''
        try {
          return await extractStatementText(doc.dataUrl)
        } catch {
          return ''
        }
      }),
    )
    const combinedText = texts.filter(Boolean).join('\n\n---\n\n')
    if (!combinedText.trim()) throw new Error('Could not read any of the uploaded bank statements')

    const result = await analyzeStatementText(combinedText)

    const [application] = await db
      .update(loanApplications)
      .set({ bankAnalysisRunAt: new Date(), bankAnalysisResult: result })
      .where(eq(loanApplications.id, data.applicationId))
      .returning()
    if (!application) throw new Error('Not found')
    return application
  })

// Branch officer, loan officer, MD, and admin can attach a bank statement while
// an application is still under review — most usefully when none was attached
// at all. Once runBankAnalysisFn has run, the list is locked — no further
// statements can be added or removed, since the analysis report already reflects them.
export const uploadBankStatementFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('branch_officer', 'loan_officer', 'md', 'admin')])
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) throw new Error('Expected FormData')
    const applicationId = formData.get('applicationId')
    const file = formData.get('file')
    if (typeof applicationId !== 'string') throw new Error('Invalid application')
    if (!(file instanceof File) || file.size === 0) throw new Error('A file is required')
    return { applicationId, file }
  })
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.applicationId)).limit(1)
    if (!application) throw new Error('Not found')
    if (['loan_officer', 'admin'].includes(context.user.role) && application.createdByUserId !== context.user.id) {
      throw new Error('Not found')
    }
    if (application.bankAnalysisRunAt) throw new Error('Bank statement analysis has already been run for this application')

    const { writeUploadedFile, fileToDataUrl } = await import('#/lib/documents/storage.server')
    const [storedPath, dataUrl] = await Promise.all([writeUploadedFile(application.id, data.file), fileToDataUrl(data.file)])

    await db.insert(documents).values({
      loanApplicationId: application.id,
      uploadedByUserId: context.user.id,
      fileName: data.file.name,
      storedPath,
      dataUrl,
      mimeType: data.file.type || 'application/octet-stream',
      fileSize: data.file.size,
      documentType: 'Bank Statement',
    })

    return { ok: true }
  })

export const deleteBankStatementFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('branch_officer', 'credit_officer')])
  .validator(z.object({ documentId: z.string() }))
  .handler(async ({ data }) => {
    const [document] = await db.select().from(documents).where(eq(documents.id, data.documentId)).limit(1)
    if (!document || document.documentType !== 'Bank Statement') throw new Error('Not found')

    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, document.loanApplicationId)).limit(1)
    if (application?.bankAnalysisRunAt) throw new Error('Bank statement analysis has already been run for this application')

    await db.delete(documents).where(eq(documents.id, data.documentId))
    return { ok: true }
  })

// Any active reviewer can attach a document that wasn't part of the original
// submission, following the same category taxonomy used at creation time.
export const uploadAttachmentFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('branch_officer', 'credit_officer', 'loan_officer', 'md', 'admin')])
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) throw new Error('Expected FormData')
    const applicationId = formData.get('applicationId')
    const documentType = formData.get('documentType')
    const file = formData.get('file')
    if (typeof applicationId !== 'string') throw new Error('Invalid application')
    if (!ATTACHMENT_TYPES.includes(documentType as (typeof ATTACHMENT_TYPES)[number])) throw new Error('Invalid document type')
    if (!(file instanceof File) || file.size === 0) throw new Error('A file is required')
    return { applicationId, documentType: documentType as string, file }
  })
  .handler(async ({ context, data }) => {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, data.applicationId)).limit(1)
    if (!application) throw new Error('Not found')
    if (['loan_officer', 'admin'].includes(context.user.role) && application.createdByUserId !== context.user.id) {
      throw new Error('Not found')
    }
    if (['approved', 'declined'].includes(application.status)) throw new Error('A decision has already been made on this application')

    const { writeUploadedFile, fileToDataUrl } = await import('#/lib/documents/storage.server')
    const [storedPath, dataUrl] = await Promise.all([writeUploadedFile(application.id, data.file), fileToDataUrl(data.file)])

    await db.insert(documents).values({
      loanApplicationId: application.id,
      uploadedByUserId: context.user.id,
      fileName: data.file.name,
      storedPath,
      dataUrl,
      mimeType: data.file.type || 'application/octet-stream',
      fileSize: data.file.size,
      documentType: data.documentType,
    })

    return { ok: true }
  })

export const deleteAttachmentFn = createServerFn({ method: 'POST' })
  .middleware([requireRole('branch_officer', 'credit_officer')])
  .validator(z.object({ documentId: z.string() }))
  .handler(async ({ data }) => {
    const [document] = await db.select().from(documents).where(eq(documents.id, data.documentId)).limit(1)
    if (!document || document.documentType === 'Bank Statement' || document.documentType === 'Query Attachment') {
      throw new Error('Not found')
    }

    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, document.loanApplicationId)).limit(1)
    if (application && ['approved', 'declined'].includes(application.status)) {
      throw new Error('A decision has already been made on this application')
    }

    await db.delete(documents).where(eq(documents.id, data.documentId))
    return { ok: true }
  })
