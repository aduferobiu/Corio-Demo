import type { Role } from './types'

// Where the "Dashboard" sidebar item (and post-login redirect) sends each role.
export const ROLE_DASHBOARD_HOME: Record<Role, string> = {
  loan_officer: '/loan-officer/dashboard',
  branch_officer: '/branch-officer',
  credit_officer: '/credit-officer/dashboard',
  md: '/md',
  // Admin gets the same loan-officer-style experience (own application list + create).
  admin: '/loan-officer/dashboard',
}

// Where the "Loan" sidebar item sends each role (their application list / queue).
export const ROLE_LOAN_HOME: Record<Role, string> = {
  loan_officer: '/loan-officer',
  branch_officer: '/branch-officer/loan',
  credit_officer: '/credit-officer',
  md: '/md',
  admin: '/loan-officer',
}

// Where each role's per-application detail view lives — used to build links to a
// specific loan application (e.g. from a customer's application history).
export const ROLE_APPLICATION_DETAIL: Record<Role, (applicationId: string) => string> = {
  loan_officer: (id) => `/loan-officer/${id}`,
  branch_officer: (id) => `/branch-officer/${id}`,
  credit_officer: (id) => `/credit-officer/${id}`,
  md: (id) => `/md/${id}`,
  admin: (id) => `/loan-officer/${id}`,
}
