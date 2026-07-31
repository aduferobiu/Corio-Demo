import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}

export const users = sqliteTable('users', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', {
    enum: ['loan_officer', 'branch_officer', 'credit_officer', 'md', 'admin'],
  }).notNull(),
  branch: text('branch'),
  avatarUrl: text('avatar_url'),
  status: text('status', { enum: ['active', 'pending'] }).notNull().default('active'),
  lastActivityAt: integer('last_activity_at', { mode: 'timestamp' }),
  ...timestamps,
})

export const roles = sqliteTable('roles', {
  id: id(),
  name: text('name').notNull(),
  // JSON-stringified array of permission keys, e.g. ["customers.view", "loans.approve"]
  permissions: text('permissions').notNull(),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => users.id),
  ...timestamps,
})

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
)

export const customers = sqliteTable(
  'customers',
  {
    id: id(),
    fullName: text('full_name').notNull(),
    phoneNumber: text('phone_number').notNull(),
    email: text('email'),
    address: text('address'),
    bvn: text('bvn'),
    nin: text('nin'),
    employmentType: text('employment_type', { enum: ['employed', 'self_employed'] }),
    employerName: text('employer_name'),
    businessName: text('business_name'),
    monthlyIncome: integer('monthly_income'),
    guarantorName: text('guarantor_name'),
    guarantorPhone: text('guarantor_phone'),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (table) => [index('customers_phone_idx').on(table.phoneNumber)],
)

export const loanApplications = sqliteTable(
  'loan_applications',
  {
    id: id(),
    referenceNumber: text('reference_number').notNull().unique(),
    customerId: text('customer_id').references(() => customers.id),

    // Applicant
    applicantName: text('applicant_name').notNull(),
    applicantPhone: text('applicant_phone').notNull(),
    applicantEmail: text('applicant_email'),
    applicantAddress: text('applicant_address'),
    bvn: text('bvn'),
    employmentType: text('employment_type', { enum: ['employed', 'self_employed'] }),
    employerName: text('employer_name'),
    businessName: text('business_name'),
    monthlyIncome: integer('monthly_income'),

    // Guarantor
    guarantorName: text('guarantor_name'),
    guarantorPhone: text('guarantor_phone'),

    // Loan details
    loanType: text('loan_type', { enum: ['business_loan', 'personal_loan'] }),
    amountRequested: integer('amount_requested').notNull(),
    loanPurpose: text('loan_purpose'),
    loanDurationMonths: integer('loan_duration_months'),
    interestRateBps: integer('interest_rate_bps'),
    totalAmountDue: integer('total_amount_due'),

    status: text('status', {
      enum: ['draft', 'submitted', 'queried', 'with_credit', 'approved', 'declined', 'rejected'],
    })
      .notNull()
      .default('draft'),

    branch: text('branch'),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id),

    // Set to the status the application was in right before a query was raised
    // (by branch or credit officer), so responding restores it correctly.
    preQueryStatus: text('pre_query_status'),

    decidedByUserId: text('decided_by_user_id').references(() => users.id),
    decisionNotes: text('decision_notes'),

    // Set once the branch officer has run the illustrative bank statement
    // analysis for this application; gates the "Run Analysis" vs "View Report" button.
    bankAnalysisRunAt: integer('bank_analysis_run_at', { mode: 'timestamp' }),

    submittedAt: integer('submitted_at', { mode: 'timestamp' }),
    decidedAt: integer('decided_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (table) => [
    index('loan_applications_status_idx').on(table.status),
    index('loan_applications_created_by_idx').on(table.createdByUserId),
    index('loan_applications_customer_idx').on(table.customerId),
  ],
)

export const loanStatusHistory = sqliteTable(
  'loan_status_history',
  {
    id: id(),
    loanApplicationId: text('loan_application_id')
      .notNull()
      .references(() => loanApplications.id),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => users.id),
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('loan_status_history_application_idx').on(table.loanApplicationId)],
)

export const comments = sqliteTable(
  'comments',
  {
    id: id(),
    loanApplicationId: text('loan_application_id')
      .notNull()
      .references(() => loanApplications.id),
    authorUserId: text('author_user_id')
      .notNull()
      .references(() => users.id),
    type: text('type', { enum: ['query', 'response', 'note'] })
      .notNull()
      .default('note'),
    body: text('body').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('comments_application_idx').on(table.loanApplicationId)],
)

export const documents = sqliteTable(
  'documents',
  {
    id: id(),
    loanApplicationId: text('loan_application_id')
      .notNull()
      .references(() => loanApplications.id),
    // Set when this document is a query-thread attachment rather than an
    // application-level upload.
    commentId: text('comment_id').references(() => comments.id),
    uploadedByUserId: text('uploaded_by_user_id')
      .notNull()
      .references(() => users.id),
    fileName: text('file_name').notNull(),
    storedPath: text('stored_path').notNull(),
    // Inline base64 data URL, used so the browser can preview/download the
    // file directly without a dedicated file-serving route.
    dataUrl: text('data_url'),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    documentType: text('document_type').notNull().default('other'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('documents_application_idx').on(table.loanApplicationId), index('documents_comment_idx').on(table.commentId)],
)

// General company document repository (distinct from the per-application `documents`
// table above) — supports folders, versioning and an admin approval workflow.
export const companyDocuments = sqliteTable(
  'company_documents',
  {
    id: id(),
    name: text('name').notNull(),
    folder: text('folder', {
      enum: ['general', 'loans', 'contracts', 'invoices', 'hr', 'compliance', 'reports'],
    })
      .notNull()
      .default('general'),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] })
      .notNull()
      .default('pending'),
    currentVersion: integer('current_version').notNull().default(1),
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => users.id),
    approvedByUserId: text('approved_by_user_id').references(() => users.id),
    ...timestamps,
  },
  (table) => [index('company_documents_status_idx').on(table.status), index('company_documents_folder_idx').on(table.folder)],
)

export const companyDocumentVersions = sqliteTable(
  'company_document_versions',
  {
    id: id(),
    documentId: text('document_id')
      .notNull()
      .references(() => companyDocuments.id),
    version: integer('version').notNull(),
    fileName: text('file_name').notNull(),
    storedPath: text('stored_path').notNull(),
    dataUrl: text('data_url'),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    uploadedByUserId: text('uploaded_by_user_id')
      .notNull()
      .references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('company_document_versions_document_idx').on(table.documentId)],
)

export const companyDocumentActivity = sqliteTable(
  'company_document_activity',
  {
    id: id(),
    documentId: text('document_id')
      .notNull()
      .references(() => companyDocuments.id),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => users.id),
    action: text('action', {
      enum: ['created', 'uploaded_version', 'approved', 'rejected'],
    }).notNull(),
    detail: text('detail'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('company_document_activity_document_idx').on(table.documentId)],
)
