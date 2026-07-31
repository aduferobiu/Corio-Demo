import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db/client'
import { loanApplications, users } from '#/db/schema'
import { requireRole } from '#/lib/auth/middleware'
import { DASHBOARD_RANGE_PRESETS, resolveDashboardRange } from '#/lib/loans/date-range'

const dashboardRangeValidator = z.object({
  range: z.enum(DASHBOARD_RANGE_PRESETS).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export const getLoanOfficerDashboardFn = createServerFn({ method: 'GET' })
  .middleware([requireRole('loan_officer', 'admin')])
  .validator(dashboardRangeValidator)
  .handler(async ({ context, data }) => {
    const { from, to } = resolveDashboardRange(data)
    const applications = await db
      .select()
      .from(loanApplications)
      .where(and(eq(loanApplications.createdByUserId, context.user.id), gte(loanApplications.createdAt, from), lte(loanApplications.createdAt, to)))
      .orderBy(desc(loanApplications.updatedAt))

    const openQueries = applications.filter((a) => a.status === 'queried').sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())

    return {
      totalApplications: applications.length,
      pendingReview: applications.filter((a) => a.status === 'submitted' || a.status === 'with_credit').length,
      queriesNeedingResponse: openQueries.length,
      approved: applications.filter((a) => a.status === 'approved').length,
      declined: applications.filter((a) => a.status === 'declined' || a.status === 'rejected').length,
      openQueries,
      applications,
    }
  })

export const getCreditOfficerDashboardFn = createServerFn({ method: 'GET' })
  .middleware([requireRole('credit_officer')])
  .validator(dashboardRangeValidator)
  .handler(async ({ context, data }) => {
    const { from, to } = resolveDashboardRange(data)
    const applications = await db
      .select()
      .from(loanApplications)
      .where(and(gte(loanApplications.createdAt, from), lte(loanApplications.createdAt, to)))

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const awaitingReview = applications
      .filter((a) => a.status === 'with_credit')
      .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())

    const decidedByMe = applications.filter((a) => a.decidedByUserId === context.user.id && a.decidedAt)
    const approvedThisMonth = decidedByMe.filter((a) => a.status === 'approved' && a.decidedAt! >= monthStart).length
    const declinedThisMonth = decidedByMe.filter((a) => a.status === 'rejected' && a.decidedAt! >= monthStart).length

    const decisionTimesHours = decidedByMe
      .filter((a) => a.submittedAt && a.decidedAt)
      .map((a) => (a.decidedAt!.getTime() - a.submittedAt!.getTime()) / 3_600_000)
    const avgDecisionHours = decisionTimesHours.length
      ? decisionTimesHours.reduce((sum, v) => sum + v, 0) / decisionTimesHours.length
      : 0

    const actionedToday = decidedByMe
      .filter((a) => a.decidedAt! >= dayStart)
      .sort((a, b) => b.decidedAt!.getTime() - a.decidedAt!.getTime())

    return { awaitingReview, approvedThisMonth, declinedThisMonth, avgDecisionHours, actionedToday }
  })

// Shared by MD (all branches) and branch officer (own branch only).
export const getManagementDashboardFn = createServerFn({ method: 'GET' })
  .middleware([requireRole('md', 'branch_officer')])
  .validator(dashboardRangeValidator)
  .handler(async ({ context, data }) => {
    const branchFilter = context.user.role === 'branch_officer' ? context.user.branch : undefined
    const { from, to } = resolveDashboardRange(data)

    const rows = await db
      .select({ app: loanApplications, officer: users })
      .from(loanApplications)
      .leftJoin(users, eq(users.id, loanApplications.createdByUserId))
      .where(and(gte(loanApplications.createdAt, from), lte(loanApplications.createdAt, to)))

    const scoped = branchFilter ? rows.filter((r) => r.app.branch === branchFilter) : rows

    const totalApplications = scoped.length
    const pendingReview = scoped.filter((r) => ['submitted', 'with_credit', 'queried'].includes(r.app.status)).length
    const approved = scoped.filter((r) => r.app.status === 'approved').length
    const declined = scoped.filter((r) => r.app.status === 'declined' || r.app.status === 'rejected').length
    const totalAmountRequested = scoped.reduce((sum, r) => sum + r.app.amountRequested, 0)

    const decided = scoped.filter((r) => r.app.submittedAt && r.app.decidedAt)
    const avgProcessingHours = decided.length
      ? decided.reduce((sum, r) => sum + (r.app.decidedAt!.getTime() - r.app.submittedAt!.getTime()) / 3_600_000, 0) / decided.length
      : 0

    const pipeline = [...scoped]
      .sort((a, b) => b.app.updatedAt.getTime() - a.app.updatedAt.getTime())
      .slice(0, 20)
      .map((r) => ({ ...r.app, assignedToName: r.officer?.name ?? '—' }))

    const staffMap = new Map<string, { name: string; count: number }>()
    for (const r of scoped) {
      if (!r.officer) continue
      const entry = staffMap.get(r.officer.id) ?? { name: r.officer.name, count: 0 }
      entry.count += 1
      staffMap.set(r.officer.id, entry)
    }
    const staffPerformance = [...staffMap.values()].sort((a, b) => b.count - a.count).slice(0, 8)

    const nowMs = Date.now()
    const overdueAlerts = scoped
      .filter((r) => r.app.status === 'queried' || r.app.status === 'with_credit')
      .map((r) => {
        const hoursInStage = (nowMs - r.app.updatedAt.getTime()) / 3_600_000
        const targetHours = r.app.status === 'with_credit' ? 4 : 24
        return {
          id: r.app.id,
          referenceNumber: r.app.referenceNumber,
          applicantName: r.app.applicantName,
          status: r.app.status,
          hoursInStage,
          targetHours,
        }
      })
      .filter((x) => x.hoursInStage > x.targetHours * 0.5)
      .sort((a, b) => b.hoursInStage - b.targetHours - (a.hoursInStage - a.targetHours))
      .slice(0, 6)

    return { totalApplications, pendingReview, approved, declined, totalAmountRequested, avgProcessingHours, pipeline, staffPerformance, overdueAlerts }
  })
