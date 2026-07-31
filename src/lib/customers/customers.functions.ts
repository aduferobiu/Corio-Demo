import { desc, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db/client'
import { customers, loanApplications } from '#/db/schema'
import { authMiddleware } from '#/lib/auth/middleware'

export const listCustomersFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    return db.select().from(customers).orderBy(desc(customers.createdAt))
  })

export const getCustomerFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const [customer] = await db.select().from(customers).where(eq(customers.id, data.id)).limit(1)
    if (!customer) throw new Error('Not found')

    const applications = await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.customerId, customer.id))
      .orderBy(desc(loanApplications.updatedAt))

    return { customer, applications }
  })

const customerSchema = z.object({
  fullName: z.string().min(1),
  phoneNumber: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  bvn: z.string().optional(),
  nin: z.string().optional(),
  employmentType: z.enum(['employed', 'self_employed']).optional(),
  employerName: z.string().optional(),
  businessName: z.string().optional(),
  monthlyIncome: z.coerce.number().int().nonnegative().optional(),
  guarantorName: z.string().optional(),
  guarantorPhone: z.string().optional(),
})

// Open to any authenticated role — every role can create a customer profile.
export const createCustomerFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(customerSchema)
  .handler(async ({ context, data }) => {
    const [customer] = await db
      .insert(customers)
      .values({ ...data, email: data.email || null, createdByUserId: context.user.id })
      .returning()
    return customer
  })

const updateCustomerSchema = z.object({
  id: z.string(),
  nin: z.string().optional(),
  employmentType: z.enum(['employed', 'self_employed']).optional(),
  employerName: z.string().optional(),
  businessName: z.string().optional(),
  monthlyIncome: z.coerce.number().int().nonnegative().optional(),
})

// Open to any authenticated role.
export const updateCustomerFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(updateCustomerSchema)
  .handler(async ({ data }) => {
    const { id, ...patch } = data
    const [customer] = await db
      .update(customers)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning()
    if (!customer) throw new Error('Not found')
    return customer
  })
