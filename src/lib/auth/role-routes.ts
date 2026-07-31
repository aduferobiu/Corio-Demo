import type { Role } from './types'

// Where the "Dashboard" sidebar item (and post-login redirect) sends each role.
export const ROLE_DASHBOARD_HOME: Record<Role, string> = {
  loan_officer: '/loan-officer/dashboard',
  branch_officer: '/branch-officer',
  credit_officer: '/credit-officer/dashboard',
  md: '/md',
  admin: '/coming-soon',
}

// Where the "Loan" sidebar item sends each role (their application list / queue).
export const ROLE_LOAN_HOME: Record<Role, string> = {
  loan_officer: '/loan-officer',
  branch_officer: '/branch-officer',
  credit_officer: '/credit-officer',
  md: '/md',
  admin: '/coming-soon',
}
